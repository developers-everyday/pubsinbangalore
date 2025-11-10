-- Seed canonical Bangalore localities for launch
insert into public.localities (name, slug, latitude, longitude)
values
    ('Indiranagar', 'indiranagar', 12.971891, 77.641151),
    ('Koramangala', 'koramangala', 12.935223, 77.624485),
    ('Whitefield', 'whitefield', 12.969800, 77.750000),
    ('HSR Layout', 'hsr-layout', 12.911600, 77.641200),
    ('MG Road', 'mg-road', 12.975600, 77.604700),
    ('Church Street', 'church-street', 12.973800, 77.605400),
    ('Jayanagar', 'jayanagar', 12.925000, 77.593800),
    ('JP Nagar', 'jp-nagar', 12.906000, 77.585000),
    ('Brigade Road', 'brigade-road', 12.972200, 77.607000),
    ('Marathahalli', 'marathahalli', 12.959200, 77.697400),
    ('Bellandur', 'bellandur', 12.930400, 77.678400),
    ('Hebbal', 'hebbal', 13.035200, 77.597000)
on conflict (slug) do nothing;
