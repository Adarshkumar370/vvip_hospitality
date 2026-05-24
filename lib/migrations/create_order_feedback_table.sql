INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'order-feedback',
    'order-feedback',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS order_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    issue_type varchar(60) NOT NULL,
    description text NOT NULL,
    image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
    status varchar(30) NOT NULL DEFAULT 'open',
    resolution_notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    version bigint NOT NULL DEFAULT 1,

    CONSTRAINT chk_order_feedback_issue_type
        CHECK (issue_type IN ('quality', 'missing_item', 'wrong_item', 'delivery', 'payment', 'other')),
    CONSTRAINT chk_order_feedback_description
        CHECK (length(btrim(description)) >= 3),
    CONSTRAINT chk_order_feedback_status
        CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
    CONSTRAINT chk_order_feedback_image_urls
        CHECK (jsonb_typeof(image_urls) = 'array')
);

ALTER TABLE order_feedback
    DROP CONSTRAINT IF EXISTS chk_order_feedback_description,
    ADD CONSTRAINT chk_order_feedback_description
        CHECK (length(btrim(description)) >= 3);

CREATE INDEX IF NOT EXISTS ix_order_feedback_order_id
    ON order_feedback (order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_order_feedback_user_id
    ON order_feedback (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_order_feedback_status
    ON order_feedback (status, created_at DESC);

DROP TRIGGER IF EXISTS trg_order_feedback_set_updated_at ON order_feedback;

CREATE TRIGGER trg_order_feedback_set_updated_at
BEFORE UPDATE ON order_feedback
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_and_version();
