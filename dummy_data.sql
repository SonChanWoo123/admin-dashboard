-- Insert dummy data into detection_logs
insert into public.detection_logs (text_content, confidence, threshold_used, model_version, is_harmful)
values
('This is a safe message.', 0.05, 0.5, 'koelectra-v1', false),
('I hate you!', 0.95, 0.5, 'koelectra-v1', true),
('Have a nice day.', 0.01, 0.5, 'kanana-v1', false),
('You are stupid.', 0.88, 0.5, 'kanana-v1', true),
('Suspicious content here.', 0.6, 0.5, 'koelectra-v1', true);
