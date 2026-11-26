-- @handle change limit: once every 30 days → once every 14 days (9.2 Edit profile).
-- Same guard as 20261120000000_security_hardening.sql (bio length, avatar URL, @handle limit); only the interval changes.
-- The trigger profiles_owner_guard already calls this function, so redefining it is enough.

create or replace function profiles_owner_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.bio is distinct from old.bio and new.bio is not null and char_length(new.bio) > 80 then
    raise exception 'bio_too_long' using errcode = '22001';
  end if;

  if new.avatar_url is distinct from old.avatar_url and new.avatar_url is not null
     and not is_own_storage_url(new.avatar_url, 'avatars', new.id) then
    raise exception 'invalid_image_url' using errcode = '42501';
  end if;

  if new.username is distinct from old.username then
    -- null = the dev-only "reset onboarding"; a new handle inside the 14 days is refused
    if new.username is not null and old.handle_changed_at is not null
       and old.handle_changed_at > now() - interval '14 days' then
      raise exception 'handle-cooldown' using errcode = 'P0001';
    end if;
    -- a handle the user picked starts the 14 days now (the server's clock, not the phone's)
    new.handle_changed_at := case when new.handle_auto_generated then old.handle_changed_at else now() end;
  else
    new.handle_changed_at := old.handle_changed_at;
  end if;
  return new;
end;
$$;
