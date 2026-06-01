-- Sample data mirroring the prototype. Only seeds when the tables are empty.
do $$
declare
  p_launch    uuid;
  p_mobile    uuid;
  p_freelance uuid;
  p_home      uuid;
begin
  if exists (select 1 from public.projects) or exists (select 1 from public.tasks) then
    return;
  end if;

  insert into public.projects (name, position) values ('Launch', 1)     returning id into p_launch;
  insert into public.projects (name, position) values ('Mobile App', 2) returning id into p_mobile;
  insert into public.projects (name, position) values ('Freelance', 3)  returning id into p_freelance;
  insert into public.projects (name, position) values ('Home', 4)       returning id into p_home;

  insert into public.tasks (title, project_id, done, flagged, position) values
    ('Draft Q3 positioning', p_launch, false, true,  1),
    ('Press kit assets',     p_launch, false, false, 2),
    ('Schedule webinar',     p_launch, false, false, 3),
    ('Landing page copy',    p_launch, true,  false, 4),
    ('Webinar run-of-show',  p_launch, true,  false, 5),
    ('Review PR #214',       p_mobile, false, false, 6),
    ('Fix onboarding bug',   p_mobile, false, true,  7),
    ('Spec the sync layer',  p_mobile, false, false, 8),
    ('Wireframe settings',   p_mobile, true,  false, 9),
    ('Send invoice 0042',    p_freelance, false, false, 10),
    ('Export final logos',   p_freelance, true,  false, 11),
    ('Renew home insurance', p_home,   false, false, 12),
    ('Reply to landlord',    null,     false, true,  13),
    ('Book dentist',         null,     false, false, 14),
    ('Renew passport',       null,     false, false, 15);

  -- give seeded completed tasks a completion time so they age out like real ones
  update public.tasks set completed_at = now() where done = true and completed_at is null;
end $$;
