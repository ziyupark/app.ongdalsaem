-- 9.4 "Today's pick" push — up to 5 times a day instead of one.
--
--   pick_times   — local wall-clock times from Settings, 1 to 5 (default {07:30}). Replaces pick_time for sending;
--                  pick_time stays (the app keeps it = the first time) so older builds' rows still work.
--   last_sent_at — when the last pick was sent. With several times a day the per-day last_sent_on can't stop a
--                  repeat, so the function now skips anyone sent to within the last 15 minutes (one cron window).

alter table push_tokens
  add column if not exists pick_times time[] not null default '{07:30}',
  add column if not exists last_sent_at timestamptz;

update push_tokens set pick_times = array[pick_time] where pick_times = '{07:30}' and pick_time <> '07:30';

alter table push_tokens drop constraint if exists push_tokens_pick_times_count;
alter table push_tokens add constraint push_tokens_pick_times_count check (cardinality(pick_times) between 1 and 5);
