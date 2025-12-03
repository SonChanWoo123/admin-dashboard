-- Insert dummy data for user_feedback
INSERT INTO public.user_feedback (user_id, category, content, contact_email, status)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'bug', 'The dashboard is not loading properly on mobile.', 'user1@example.com', 'new'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'feature_request', 'Please add a dark mode toggle.', 'user2@example.com', 'read'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'general', 'Great app! I love the new design.', NULL, 'new'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'bug', 'I found a typo in the settings page.', 'user3@example.com', 'resolved');
