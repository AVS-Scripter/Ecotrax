CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE membership_role AS ENUM ('admin', 'moderator', 'member');
CREATE TYPE report_status AS ENUM ('in-progress', 'resolved', 'unresolved');

-- USERS (no email duplication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    rank TEXT,
    points INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- COMMUNITIES
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    member_count INTEGER DEFAULT 0 NOT NULL CHECK (member_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- MEMBERSHIPS
CREATE TABLE IF NOT EXISTS memberships (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    role membership_role NOT NULL DEFAULT 'member',
    display_name TEXT NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, community_id)
);

-- INVITES
CREATE TABLE IF NOT EXISTS invites (
    code VARCHAR(50) PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    community_name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0 NOT NULL CHECK (used_count >= 0),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- REPORTS
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    image TEXT,
    status report_status DEFAULT 'unresolved' NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- GLOBAL STATS
CREATE TABLE IF NOT EXISTS global_stats (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    total_reports INTEGER DEFAULT 0 NOT NULL,
    monitored_zones INTEGER DEFAULT 0 NOT NULL,
    total_users INTEGER DEFAULT 0 NOT NULL,
    lifetime_visits INTEGER DEFAULT 0 NOT NULL,
    monthly_reports JSONB DEFAULT '{}'::JSONB NOT NULL
);

-- =========================
-- AUTH SYNC: auto-populate public.users from auth.users
-- =========================

-- Function to sync new auth.users into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: automatically insert user into public.users when auth.users is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- TRIGGERS
-- =========================

CREATE OR REPLACE FUNCTION ensure_community_has_admin() RETURNS trigger AS $$
DECLARE
    admin_count INTEGER;
BEGIN
    IF (TG_OP = 'DELETE' AND OLD.role = 'admin') OR
       (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin') THEN

        SELECT COUNT(*) INTO admin_count
        FROM memberships
        WHERE community_id = OLD.community_id
          AND user_id <> OLD.user_id
          AND role = 'admin';

        IF admin_count = 0 THEN
            RAISE EXCEPTION 'Community must retain at least one admin.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_admin_on_membership_change
AFTER UPDATE OR DELETE ON memberships
FOR EACH ROW EXECUTE FUNCTION ensure_community_has_admin();

-- =========================
-- FUNCTIONS (UNCHANGED CORE LOGIC)
-- =========================

CREATE OR REPLACE FUNCTION create_community(
    p_name TEXT,
    p_icon TEXT,
    p_created_by UUID,
    p_display_name TEXT,
    p_invite_code TEXT DEFAULT UPPER(SUBSTRING(md5(random()::TEXT) FROM 1 FOR 8))
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO communities (name, icon, created_by, member_count)
    VALUES (p_name, p_icon, p_created_by, 1)
    RETURNING id INTO new_id;

    INSERT INTO memberships (user_id, community_id, role, display_name)
    VALUES (p_created_by, new_id, 'admin', p_display_name);

    INSERT INTO invites (code, community_id, community_name, created_by)
    VALUES (p_invite_code, new_id, p_name, p_created_by);

    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION join_via_invite(
    p_code TEXT,
    p_user_id UUID,
    p_display_name TEXT
)
RETURNS UUID AS $$
DECLARE
    invite_record RECORD;
BEGIN
    SELECT * INTO invite_record FROM invites WHERE code = p_code;

    IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invite'; END IF;

    IF invite_record.expires_at IS NOT NULL AND invite_record.expires_at < NOW() THEN
        RAISE EXCEPTION 'Expired invite';
    END IF;

    IF invite_record.max_uses IS NOT NULL AND invite_record.used_count >= invite_record.max_uses THEN
        RAISE EXCEPTION 'Invite limit reached';
    END IF;

    IF EXISTS (
        SELECT 1 FROM memberships WHERE user_id = p_user_id AND community_id = invite_record.community_id
    ) THEN
        RAISE EXCEPTION 'Already member';
    END IF;

    UPDATE invites SET used_count = used_count + 1 WHERE code = p_code;

    UPDATE communities SET member_count = member_count + 1
    WHERE id = invite_record.community_id;

    INSERT INTO memberships (user_id, community_id, display_name)
    VALUES (p_user_id, invite_record.community_id, p_display_name);

    RETURN invite_record.community_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- RLS
-- =========================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "read own user" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "update own user" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "insert own user" ON users FOR INSERT WITH CHECK (
  auth.uid() = id OR auth.role() = 'service_role'
);

-- COMMUNITIES
CREATE POLICY "members read communities" ON communities FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND community_id = communities.id
    )
);

CREATE POLICY "create communities" ON communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "admins update communities" ON communities FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND community_id = communities.id
        AND role = 'admin'
    )
);

-- MEMBERSHIPS (FIXED)
CREATE POLICY "members read memberships" ON memberships FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM memberships m
        WHERE m.user_id = auth.uid()
        AND m.community_id = memberships.community_id
    )
);

-- ❌ REMOVED unsafe insert policy

CREATE POLICY "admins update memberships" ON memberships FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM memberships m
        WHERE m.user_id = auth.uid()
        AND m.community_id = memberships.community_id
        AND m.role = 'admin'
    )
);

CREATE POLICY "self or admin delete membership" ON memberships FOR DELETE USING (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM memberships m
        WHERE m.user_id = auth.uid()
        AND m.community_id = memberships.community_id
        AND m.role = 'admin'
    )
);

-- INVITES (FIXED)
CREATE POLICY "members read invites" ON invites FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND community_id = invites.community_id
    )
);

CREATE POLICY "admins insert invites" ON invites FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND community_id = invites.community_id
        AND role = 'admin'
    )
);

CREATE POLICY "admins update invites" ON invites FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND community_id = invites.community_id
        AND role = 'admin'
    )
);

-- REPORTS
CREATE POLICY "members read reports" ON reports FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND community_id = reports.community_id
    )
);

CREATE POLICY "members create reports" ON reports FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND community_id = reports.community_id
    )
);

CREATE POLICY "owner or mod update reports" ON reports FOR UPDATE USING (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = auth.uid()
        AND community_id = reports.community_id
        AND role IN ('moderator', 'admin')
    )
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_community_id ON memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_reports_community_status ON reports(community_id, status);
CREATE INDEX IF NOT EXISTS idx_invites_community_id ON invites(community_id);