create or replace function crear_reserva(
    p_nombre    text,
    p_telefono  text,
    p_email     text,
    p_inicio    timestamptz,
    p_fin       timestamptz,
    p_items     jsonb   -- [{ servicio_id, precio_original, precio_reserva, oferta_id }]
)
returns uuid
language plpgsql
as $$
declare
    v_cliente uuid;
    v_turno   uuid;
begin
    insert into clientes (nombre_completo, telefono, email)
    values (p_nombre, p_telefono, nullif(p_email, ''))
    returning id into v_cliente;

    insert into turnos (cliente_id, inicio, fin)
    values (v_cliente, p_inicio, p_fin)
    returning id into v_turno;

    insert into servicios_turno (turno_id, servicio_id, precio_original, precio_reserva, oferta_id)
    select
    v_turno,
    (i ->> 'servicio_id')::bigint,
    (i ->> 'precio_original')::numeric,
    (i ->> 'precio_reserva')::numeric,
    nullif(i ->> 'oferta_id', '')::bigint
    from jsonb_array_elements(p_items) as i;

    return v_turno;
end;
$$;

-- IMPORTANTE: por defecto Postgres deja ejecutar las funciones a cualquiera,
-- incluido el rol publico (anon). Esta funcion crea turnos, asi que solo la
-- puede ejecutar el servidor de Next.js (clave secreta = rol service_role).
revoke execute on function crear_reserva(text, text, text, timestamptz, timestamptz, jsonb)
    from public, anon, authenticated;
grant execute on function crear_reserva(text, text, text, timestamptz, timestamptz, jsonb)
    to service_role;