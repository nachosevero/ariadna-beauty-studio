create table servicios (
  id                    bigint generated always as identity primary key,
  nombre                text not null,
  categoria             text not null
                        check (categoria in ('unas', 'maquillaje', 'cejas', 'pestanas', 'combos')),
  duracion_minutos      int  not null check (duracion_minutos > 0),
  preparacion_minutos   int  not null default 0 check (preparacion_minutos >= 0), 
  precio                numeric(10, 2) not null check (precio >= 0),               
  descripcion           text,
  activo                boolean not null default true
);

create table clientes (
  id               uuid primary key default gen_random_uuid(),
  nombre_completo  text not null,
  telefono         text not null,
  email            text,
  creado_el        timestamptz not null default now()
);

create table horarios_trabajo (
  id              bigint generated always as identity primary key,
  dia_semanal     smallint not null check (dia_semanal between 0 and 6),
  horario_inicio  time not null,
  horario_fin     time not null,
  check (horario_fin > horario_inicio)
);

create table dias_libres (
  id      bigint generated always as identity primary key,
  inicio  timestamptz not null,
  fin     timestamptz not null,
  razon   text,
  check (fin > inicio)  
);

create table turnos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references clientes(id),
  inicio      timestamptz not null,
  fin         timestamptz not null,
  estado      text not null default 'confirmado'
              check (estado in ('pendiente', 'confirmado', 'cancelado', 'completado', 'no_mostrar')),
  notas       text,
  creado_el   timestamptz not null default now(),
  check (fin > inicio),

  constraint no_superposicion_turnos
    exclude using gist (tstzrange(inicio, fin) with &&)
    where (estado in ('pendiente', 'confirmado'))
);

create table ofertas (
  id                bigint generated always as identity primary key,
  nombre            text not null,
  servicio_id       bigint references servicios(id),
  categoria         text check (categoria in ('unas', 'maquillaje', 'cejas', 'pestanas', 'combos')),
  tipo_descuento    text not null check (tipo_descuento in ('porcentaje', 'fijo')),
  valor_descuento   numeric(10, 2) not null check (valor_descuento > 0),
  inicio_descuento  timestamptz not null,
  fin_descuento     timestamptz not null,
  activo            boolean not null default true,
  check (fin_descuento > inicio_descuento),
  check (servicio_id is not null or categoria is not null),
  check (tipo_descuento <> 'porcentaje' or valor_descuento <= 100)
);

create table servicios_turno (
  turno_id         uuid   not null references turnos(id) on delete cascade,
  servicio_id      bigint not null references servicios(id),
  precio_original  numeric(10, 2) not null,   -- precio de lista al reservar
  precio_reserva   numeric(10, 2) not null,   -- precio cobrado (con oferta si aplica)
  oferta_id        bigint references ofertas(id), -- oferta aplicada, si hubo
  primary key (turno_id, servicio_id)
);


alter table servicios         enable row level security;
alter table clientes          enable row level security;
alter table horarios_trabajo  enable row level security;
alter table dias_libres       enable row level security;
alter table turnos            enable row level security;
alter table servicios_turno   enable row level security;
alter table ofertas           enable row level security;

create policy "Servicios activos visibles para todos"
  on servicios for select using (activo = true);

create policy "Horarios de trabajo visibles para todos"
  on horarios_trabajo for select using (true);

create policy "Ofertas activas visibles para todos"
  on ofertas for select using (activo = true);


grant select on public.servicios        to anon;
grant select on public.horarios_trabajo to anon;
grant select on public.ofertas          to anon;

grant select, insert, update, delete on all tables in schema public to service_role;


insert into servicios (nombre, categoria, precio, duracion_minutos) values
  -- CEJAS
  ('Diseño y perfilado',                           'cejas',      290, 60),
  ('Diseño, perfilado y henna',                    'cejas',      490, 60),
  ('Laminado, diseño y perfilado',                 'cejas',      650, 60),
  ('Laminado, diseño, perfilado y henna',          'cejas',      900, 60),
  ('Reconstrucción de cejas - 1 sesión',           'cejas',      600, 60),
  ('Reconstrucción de cejas - 2 sesiones',         'cejas',     1000, 60),
  ('Reconstrucción de cejas - 3 sesiones',         'cejas',     1400, 60),

  -- PESTAÑAS (la categoria se guarda sin ñ: 'pestanas')
  ('Lifting de pestañas',                          'pestanas',   750, 60),
  ('Volumen Brasilero',                            'pestanas',  1400, 60),
  ('Volumen 3D',                                   'pestanas',  1400, 60),
  ('Clásicas',                                     'pestanas',  1300, 60),
  ('Efecto Rimel',                                 'pestanas',  1600, 60),
  ('Rímel Tech U',                                 'pestanas',  1400, 60),
  ('Retiro de pestañas',                           'pestanas',   250, 60),

  -- MAQUILLAJE
  ('Maquillaje Social',                            'maquillaje', 1000, 60),
  ('Maquillaje Artístico',                         'maquillaje', 1300, 60),

  -- COMBOS
  ('Lifting, diseño y perfilado de cejas',         'combos',     850, 60),
  ('Lifting, henna, diseño y perfilado de cejas',  'combos',    1100, 60),
  ('Lifting, laminado, diseño y perfilado',        'combos',    1250, 60),
  ('Lifting, laminado, henna, diseño y perfilado', 'combos',    1400, 60),

  -- UÑAS
  ('Semipermanente',                               'unas',       500, 60),
  ('Kapping gel',                                  'unas',       700, 60),
  ('Soft gel',                                     'unas',       800, 60),
  ('Diseño extra',                                 'unas',       100, 60),
  ('Retiro + manicura',                            'unas',       300, 60),
  ('Arreglo de hasta 3 uñas',                      'unas',        50, 60);



-- Para ir completando las duraciones reales, por ejemplo:
-- update servicios set duracion_minutos = 45, preparacion_minutos = 10
--   where nombre = 'Diseño y perfilado';

insert into horarios_trabajo (dia_semanal, horario_inicio, horario_fin) values
  (1, '09:00', '13:00'), (1, '15:00', '19:00'),
  (2, '09:00', '13:00'), (2, '15:00', '19:00'),
  (3, '09:00', '13:00'), (3, '15:00', '19:00'),
  (4, '09:00', '13:00'), (4, '15:00', '19:00'),
  (5, '09:00', '13:00'), (5, '15:00', '19:00');

-- Para cambiar un horario, por ejemplo:
-- update horarios_trabajo set horario_inicio = '10:00', horario_fin = '13:00'
--   where dia_semanal = 1;