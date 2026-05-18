--
-- PostgreSQL database dump
--

\restrict cdo1KDMkMzyvllLXsNuHlh6fs8b9YYd8mjx8oyFFaN5eaEcDdiwBEb4TuYChpIp

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-13 17:18:02

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 18901)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--



--
-- TOC entry 6445 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--


--
-- TOC entry 2 (class 3079 OID 17819)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--



--
-- TOC entry 6446 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--


--
-- TOC entry 1022 (class 1255 OID 19709)
-- Name: fn_actualizar_bloqueo_foto(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_actualizar_bloqueo_foto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.fotos_faltantes_json IS NOT NULL
       AND jsonb_array_length(NEW.fotos_faltantes_json) > 0 THEN
        NEW.bloqueada         := TRUE;
        NEW.estado_validacion := 'RECHAZADO';
    ELSE
        NEW.bloqueada := FALSE;
        IF NEW.estado_validacion <> 'ERROR' THEN
            NEW.estado_validacion := 'APROBADO';
        END IF;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_actualizar_bloqueo_foto() OWNER TO postgres;

--
-- TOC entry 371 (class 1255 OID 19585)
-- Name: fn_gestionar_cierre_ot(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_gestionar_cierre_ot() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.id_estado_ot <> OLD.id_estado_ot THEN
        IF EXISTS (
            SELECT 1 FROM cat_estado_ot
            WHERE id_estado_ot = NEW.id_estado_ot AND es_final = TRUE
        ) THEN
            NEW.visible_en_mapa := FALSE;
            NEW.fecha_cierre    := CURRENT_DATE;
            NEW.cerrada_at      := NOW();
        END IF;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_gestionar_cierre_ot() OWNER TO postgres;

--
-- TOC entry 417 (class 1255 OID 19332)
-- Name: fn_sincronizar_gis_lote(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_sincronizar_gis_lote(p_id_lote bigint) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_tipo    VARCHAR(10);
    v_usuario BIGINT;
    v_tipo_id BIGINT;
BEGIN
    SELECT tipo_catalogo, id_usuario
      INTO v_tipo, v_usuario
      FROM imp_gis_lote
     WHERE id_lote = p_id_lote;

    SELECT id_tipo_punto INTO v_tipo_id
      FROM cat_tipo_punto_operativo
     WHERE codigo = v_tipo;

    -- 1. Desactivar puntos del lote anterior de este tipo
    UPDATE gis_punto_operativo
       SET activo = FALSE, updated_at = NOW()
     WHERE id_tipo_punto = v_tipo_id
       AND origen_registro = 'EXCEL_GIS';

    -- 2. Insertar/actualizar desde las filas del nuevo lote
    INSERT INTO gis_punto_operativo (
        id_tipo_punto, codigo_punto, nis, direccion, localidad,
        distrito, sector, latitud, longitud, origen_registro,
        estado_validacion_gis, id_gis_lote, creado_por, activo
    )
    SELECT
        v_tipo_id,
        f.codigo_punto, f.nis, f.direccion, f.localidad,
        f.distrito, f.sector, f.latitud, f.longitud,
        'EXCEL_GIS', 'VALIDADO', p_id_lote, v_usuario, TRUE
    FROM imp_gis_fila f
    WHERE f.id_lote = p_id_lote
      AND f.estado_fila = 'OK'
    ON CONFLICT DO NOTHING;

    -- 3. Actualizar FK en imp_gis_fila → id_punto_operativo generado
    UPDATE imp_gis_fila f
       SET id_punto_operativo = g.id_punto_operativo
      FROM gis_punto_operativo g
     WHERE f.id_lote = p_id_lote
       AND f.codigo_punto = g.codigo_punto
       AND g.id_gis_lote  = p_id_lote;

    -- 4. Actualizar contadores del lote
    UPDATE imp_gis_lote
       SET registros_ok    = (SELECT COUNT(*) FROM imp_gis_fila WHERE id_lote = p_id_lote AND estado_fila = 'OK'),
           registros_error = (SELECT COUNT(*) FROM imp_gis_fila WHERE id_lote = p_id_lote AND estado_fila = 'ERROR'),
           total_registros = (SELECT COUNT(*) FROM imp_gis_fila WHERE id_lote = p_id_lote),
           updated_at      = NOW()
     WHERE id_lote = p_id_lote;

END;
$$;


ALTER FUNCTION public.fn_sincronizar_gis_lote(p_id_lote bigint) OWNER TO postgres;

--
-- TOC entry 472 (class 1255 OID 19262)
-- Name: fn_sync_geom_punto(); Type: FUNCTION; Schema: public; Owner: postgres
--

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 245 (class 1259 OID 19151)
-- Name: cat_estado_ot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cat_estado_ot (
    id_estado_ot bigint NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    es_final boolean DEFAULT false NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.cat_estado_ot OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 19150)
-- Name: cat_estado_ot_id_estado_ot_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cat_estado_ot_id_estado_ot_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cat_estado_ot_id_estado_ot_seq OWNER TO postgres;

--
-- TOC entry 6447 (class 0 OID 0)
-- Dependencies: 244
-- Name: cat_estado_ot_id_estado_ot_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cat_estado_ot_id_estado_ot_seq OWNED BY public.cat_estado_ot.id_estado_ot;


--
-- TOC entry 247 (class 1259 OID 19171)
-- Name: cat_formulario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cat_formulario (
    id_formulario bigint NOT NULL,
    id_subactividad bigint NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    version integer DEFAULT 1 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cat_formulario OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 19197)
-- Name: cat_formulario_campo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cat_formulario_campo (
    id_formulario_campo bigint NOT NULL,
    id_formulario bigint NOT NULL,
    codigo_campo character varying(50) NOT NULL,
    nombre_campo character varying(150) NOT NULL,
    tipo_dato character varying(30) NOT NULL,
    obligatorio boolean DEFAULT true NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    opciones_json jsonb,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.cat_formulario_campo OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 19196)
-- Name: cat_formulario_campo_id_formulario_campo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cat_formulario_campo_id_formulario_campo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cat_formulario_campo_id_formulario_campo_seq OWNER TO postgres;

--
-- TOC entry 6448 (class 0 OID 0)
-- Dependencies: 248
-- Name: cat_formulario_campo_id_formulario_campo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cat_formulario_campo_id_formulario_campo_seq OWNED BY public.cat_formulario_campo.id_formulario_campo;


--
-- TOC entry 246 (class 1259 OID 19170)
-- Name: cat_formulario_id_formulario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cat_formulario_id_formulario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cat_formulario_id_formulario_seq OWNER TO postgres;

--
-- TOC entry 6449 (class 0 OID 0)
-- Dependencies: 246
-- Name: cat_formulario_id_formulario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cat_formulario_id_formulario_seq OWNED BY public.cat_formulario.id_formulario;


--
-- TOC entry 241 (class 1259 OID 19107)
-- Name: cat_subactividad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cat_subactividad (
    id_subactividad bigint NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cat_subactividad OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 19106)
-- Name: cat_subactividad_id_subactividad_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cat_subactividad_id_subactividad_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cat_subactividad_id_subactividad_seq OWNER TO postgres;

--
-- TOC entry 6450 (class 0 OID 0)
-- Dependencies: 240
-- Name: cat_subactividad_id_subactividad_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cat_subactividad_id_subactividad_seq OWNED BY public.cat_subactividad.id_subactividad;


--
-- TOC entry 243 (class 1259 OID 19125)
-- Name: cat_subactividad_punto_operativo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cat_subactividad_punto_operativo (
    id_subactividad_punto bigint NOT NULL,
    id_subactividad bigint NOT NULL,
    id_tipo_punto bigint NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cat_subactividad_punto_operativo OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 19124)
-- Name: cat_subactividad_punto_operativo_id_subactividad_punto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cat_subactividad_punto_operativo_id_subactividad_punto_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cat_subactividad_punto_operativo_id_subactividad_punto_seq OWNER TO postgres;

--
-- TOC entry 6451 (class 0 OID 0)
-- Dependencies: 242
-- Name: cat_subactividad_punto_operativo_id_subactividad_punto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cat_subactividad_punto_operativo_id_subactividad_punto_seq OWNED BY public.cat_subactividad_punto_operativo.id_subactividad_punto;


--
-- TOC entry 239 (class 1259 OID 19091)
-- Name: cat_tipo_punto_operativo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cat_tipo_punto_operativo (
    id_tipo_punto bigint NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.cat_tipo_punto_operativo OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 19090)
-- Name: cat_tipo_punto_operativo_id_tipo_punto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cat_tipo_punto_operativo_id_tipo_punto_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cat_tipo_punto_operativo_id_tipo_punto_seq OWNER TO postgres;

--
-- TOC entry 6452 (class 0 OID 0)
-- Dependencies: 238
-- Name: cat_tipo_punto_operativo_id_tipo_punto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cat_tipo_punto_operativo_id_tipo_punto_seq OWNED BY public.cat_tipo_punto_operativo.id_tipo_punto;


--
-- TOC entry 251 (class 1259 OID 19224)
-- Name: gis_punto_operativo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gis_punto_operativo (
    id_punto_operativo bigint NOT NULL,
    id_tipo_punto bigint NOT NULL,
    codigo_punto character varying(30),
    nis character varying(30),
    direccion text,
    localidad character varying(100),
    distrito character varying(100),
    sector character varying(100),
    latitud numeric(10,8) NOT NULL,
    longitud numeric(11,8) NOT NULL,
    origen_registro character varying(30) DEFAULT 'EXCEL_GIS'::character varying,
    estado_validacion_gis character varying(20) DEFAULT 'VALIDADO'::character varying,
    observacion text,
    id_gis_lote bigint,
    creado_por bigint,
    validado_por bigint,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    validated_at timestamp without time zone,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.gis_punto_operativo OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 19223)
-- Name: gis_punto_operativo_id_punto_operativo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gis_punto_operativo_id_punto_operativo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gis_punto_operativo_id_punto_operativo_seq OWNER TO postgres;

--
-- TOC entry 6453 (class 0 OID 0)
-- Dependencies: 250
-- Name: gis_punto_operativo_id_punto_operativo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gis_punto_operativo_id_punto_operativo_seq OWNED BY public.gis_punto_operativo.id_punto_operativo;


--
-- TOC entry 255 (class 1259 OID 19301)
-- Name: imp_gis_fila; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imp_gis_fila (
    id_gis_fila bigint NOT NULL,
    id_lote bigint NOT NULL,
    numero_fila integer NOT NULL,
    codigo_punto character varying(30) NOT NULL,
    nis character varying(30),
    direccion text,
    localidad character varying(100),
    distrito character varying(100),
    sector character varying(100),
    longitud numeric(11,8) NOT NULL,
    latitud numeric(10,8) NOT NULL,
    tipo_punto character varying(10) NOT NULL,
    estado_fila character varying(20) DEFAULT 'OK'::character varying NOT NULL,
    mensaje_error text,
    id_punto_operativo bigint,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.imp_gis_fila OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 19300)
-- Name: imp_gis_fila_id_gis_fila_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imp_gis_fila_id_gis_fila_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imp_gis_fila_id_gis_fila_seq OWNER TO postgres;

--
-- TOC entry 6454 (class 0 OID 0)
-- Dependencies: 254
-- Name: imp_gis_fila_id_gis_fila_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imp_gis_fila_id_gis_fila_seq OWNED BY public.imp_gis_fila.id_gis_fila;


--
-- TOC entry 253 (class 1259 OID 19265)
-- Name: imp_gis_lote; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imp_gis_lote (
    id_lote bigint NOT NULL,
    tipo_catalogo character varying(10) NOT NULL,
    nombre_archivo character varying(255) NOT NULL,
    archivo_url text,
    id_usuario bigint NOT NULL,
    estado character varying(20) DEFAULT 'ACTIVO'::character varying NOT NULL,
    total_registros integer DEFAULT 0 NOT NULL,
    registros_ok integer DEFAULT 0 NOT NULL,
    registros_error integer DEFAULT 0 NOT NULL,
    observacion text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.imp_gis_lote OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 19264)
-- Name: imp_gis_lote_id_lote_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imp_gis_lote_id_lote_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imp_gis_lote_id_lote_seq OWNER TO postgres;

--
-- TOC entry 6455 (class 0 OID 0)
-- Dependencies: 252
-- Name: imp_gis_lote_id_lote_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imp_gis_lote_id_lote_seq OWNED BY public.imp_gis_lote.id_lote;


--
-- TOC entry 259 (class 1259 OID 19386)
-- Name: imp_ot_fila; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imp_ot_fila (
    id_fila bigint NOT NULL,
    id_lote bigint NOT NULL,
    numero_fila_excel integer NOT NULL,
    sgio character varying(50) NOT NULL,
    nis character varying(30),
    hia_codigo character varying(50),
    vca_codigo character varying(50),
    direccion_excel text,
    localidad_excel character varying(100),
    distrito_excel character varying(100),
    sector_excel character varying(100),
    fecha_programada date,
    estado_validacion character varying(20) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    mensaje_validacion text,
    id_punto_operativo_resuelto bigint,
    requiere_revision boolean DEFAULT false NOT NULL,
    requiere_coordenada_manual boolean DEFAULT false NOT NULL,
    latitud_manual numeric(10,8),
    longitud_manual numeric(11,8),
    direccion_manual text,
    referencia_manual text,
    observacion_manual text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.imp_ot_fila OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 19385)
-- Name: imp_ot_fila_id_fila_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imp_ot_fila_id_fila_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imp_ot_fila_id_fila_seq OWNER TO postgres;

--
-- TOC entry 6456 (class 0 OID 0)
-- Dependencies: 258
-- Name: imp_ot_fila_id_fila_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imp_ot_fila_id_fila_seq OWNED BY public.imp_ot_fila.id_fila;


--
-- TOC entry 257 (class 1259 OID 19334)
-- Name: imp_ot_lote; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imp_ot_lote (
    id_lote bigint NOT NULL,
    nombre_archivo character varying(255) NOT NULL,
    archivo_url text,
    fecha_carga timestamp without time zone DEFAULT now() NOT NULL,
    periodo character varying(20),
    fecha_programada date,
    id_supervisor_usuario bigint NOT NULL,
    id_subactividad bigint,
    id_tipo_punto bigint,
    id_capataz bigint,
    estado_lote character varying(20) DEFAULT 'PROCESANDO'::character varying NOT NULL,
    total_filas integer DEFAULT 0 NOT NULL,
    filas_correctas integer DEFAULT 0 NOT NULL,
    filas_advertencia integer DEFAULT 0 NOT NULL,
    filas_error integer DEFAULT 0 NOT NULL,
    filas_duplicadas integer DEFAULT 0 NOT NULL,
    filas_coord_manual integer DEFAULT 0 NOT NULL,
    observacion text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.imp_ot_lote OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 19333)
-- Name: imp_ot_lote_id_lote_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imp_ot_lote_id_lote_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imp_ot_lote_id_lote_seq OWNER TO postgres;

--
-- TOC entry 6457 (class 0 OID 0)
-- Dependencies: 256
-- Name: imp_ot_lote_id_lote_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imp_ot_lote_id_lote_seq OWNED BY public.imp_ot_lote.id_lote;


--
-- TOC entry 261 (class 1259 OID 19421)
-- Name: imp_ot_validacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.imp_ot_validacion (
    id_validacion bigint NOT NULL,
    id_fila bigint NOT NULL,
    codigo_validacion character varying(30) NOT NULL,
    tipo_validacion character varying(20) NOT NULL,
    mensaje text NOT NULL,
    resuelto boolean DEFAULT false NOT NULL,
    resuelto_por bigint,
    fecha_resolucion timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.imp_ot_validacion OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 19420)
-- Name: imp_ot_validacion_id_validacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.imp_ot_validacion_id_validacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imp_ot_validacion_id_validacion_seq OWNER TO postgres;

--
-- TOC entry 6458 (class 0 OID 0)
-- Dependencies: 260
-- Name: imp_ot_validacion_id_validacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.imp_ot_validacion_id_validacion_seq OWNED BY public.imp_ot_validacion.id_validacion;


--
-- TOC entry 235 (class 1259 OID 19042)
-- Name: op_cuadrilla; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.op_cuadrilla (
    id_cuadrilla bigint NOT NULL,
    id_capataz bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.op_cuadrilla OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 19041)
-- Name: op_cuadrilla_id_cuadrilla_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.op_cuadrilla_id_cuadrilla_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.op_cuadrilla_id_cuadrilla_seq OWNER TO postgres;

--
-- TOC entry 6459 (class 0 OID 0)
-- Dependencies: 234
-- Name: op_cuadrilla_id_cuadrilla_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.op_cuadrilla_id_cuadrilla_seq OWNED BY public.op_cuadrilla.id_cuadrilla;


--
-- TOC entry 237 (class 1259 OID 19065)
-- Name: op_cuadrilla_miembro_plantilla; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.op_cuadrilla_miembro_plantilla (
    id_miembro_plantilla bigint NOT NULL,
    id_cuadrilla bigint NOT NULL,
    id_trabajador bigint NOT NULL,
    cargo_en_cuadrilla character varying(100),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.op_cuadrilla_miembro_plantilla OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 19064)
-- Name: op_cuadrilla_miembro_plantilla_id_miembro_plantilla_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.op_cuadrilla_miembro_plantilla_id_miembro_plantilla_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.op_cuadrilla_miembro_plantilla_id_miembro_plantilla_seq OWNER TO postgres;

--
-- TOC entry 6460 (class 0 OID 0)
-- Dependencies: 236
-- Name: op_cuadrilla_miembro_plantilla_id_miembro_plantilla_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.op_cuadrilla_miembro_plantilla_id_miembro_plantilla_seq OWNED BY public.op_cuadrilla_miembro_plantilla.id_miembro_plantilla;


--
-- TOC entry 263 (class 1259 OID 19449)
-- Name: op_jornada_campo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.op_jornada_campo (
    id_jornada bigint NOT NULL,
    id_capataz bigint NOT NULL,
    fecha_jornada date NOT NULL,
    estado character varying(20) DEFAULT 'ABIERTA'::character varying NOT NULL,
    hora_inicio timestamp without time zone,
    hora_fin timestamp without time zone,
    confirmada boolean DEFAULT false NOT NULL,
    observacion text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.op_jornada_campo OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 19448)
-- Name: op_jornada_campo_id_jornada_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.op_jornada_campo_id_jornada_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.op_jornada_campo_id_jornada_seq OWNER TO postgres;

--
-- TOC entry 6461 (class 0 OID 0)
-- Dependencies: 262
-- Name: op_jornada_campo_id_jornada_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.op_jornada_campo_id_jornada_seq OWNED BY public.op_jornada_campo.id_jornada;


--
-- TOC entry 265 (class 1259 OID 19476)
-- Name: op_jornada_miembro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.op_jornada_miembro (
    id_jornada_miembro bigint NOT NULL,
    id_jornada bigint NOT NULL,
    id_trabajador bigint NOT NULL,
    dni character varying(8) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    cargo character varying(100),
    estado_asistencia character varying(20) DEFAULT 'PRESENTE'::character varying NOT NULL,
    es_reemplazo boolean DEFAULT false NOT NULL,
    observacion text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.op_jornada_miembro OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 19475)
-- Name: op_jornada_miembro_id_jornada_miembro_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.op_jornada_miembro_id_jornada_miembro_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.op_jornada_miembro_id_jornada_miembro_seq OWNER TO postgres;

--
-- TOC entry 6462 (class 0 OID 0)
-- Dependencies: 264
-- Name: op_jornada_miembro_id_jornada_miembro_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.op_jornada_miembro_id_jornada_miembro_seq OWNED BY public.op_jornada_miembro.id_jornada_miembro;


--
-- TOC entry 267 (class 1259 OID 19509)
-- Name: op_orden_trabajo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.op_orden_trabajo (
    id_ot bigint NOT NULL,
    sgio character varying(50) NOT NULL,
    id_lote bigint,
    id_fila_importacion bigint,
    id_subactividad bigint NOT NULL,
    id_tipo_punto bigint NOT NULL,
    id_punto_operativo bigint,
    nis character varying(30),
    id_capataz bigint NOT NULL,
    id_jornada bigint,
    id_estado_ot bigint NOT NULL,
    fecha_programada date,
    fecha_inicio timestamp without time zone,
    fecha_fin timestamp without time zone,
    fecha_cierre date,
    direccion text,
    distrito character varying(100),
    sector character varying(100),
    latitud numeric(10,8),
    longitud numeric(11,8),
    visible_en_mapa boolean DEFAULT true NOT NULL,
    estado_sincronizacion character varying(20) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    estado_validacion_fotos character varying(20) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    observacion text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    cerrada_at timestamp without time zone,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.op_orden_trabajo OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 19508)
-- Name: op_orden_trabajo_id_ot_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.op_orden_trabajo_id_ot_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.op_orden_trabajo_id_ot_seq OWNER TO postgres;

--
-- TOC entry 6463 (class 0 OID 0)
-- Dependencies: 266
-- Name: op_orden_trabajo_id_ot_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.op_orden_trabajo_id_ot_seq OWNED BY public.op_orden_trabajo.id_ot;


--
-- TOC entry 269 (class 1259 OID 19588)
-- Name: op_ot_evento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.op_ot_evento (
    id_evento bigint NOT NULL,
    id_ot bigint NOT NULL,
    tipo_evento character varying(50) NOT NULL,
    estado_anterior character varying(30),
    estado_nuevo character varying(30),
    descripcion text,
    id_usuario bigint,
    fecha_evento timestamp without time zone DEFAULT now() NOT NULL,
    origen character varying(20) DEFAULT 'WEB'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.op_ot_evento OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 19587)
-- Name: op_ot_evento_id_evento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.op_ot_evento_id_evento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.op_ot_evento_id_evento_seq OWNER TO postgres;

--
-- TOC entry 6464 (class 0 OID 0)
-- Dependencies: 268
-- Name: op_ot_evento_id_evento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.op_ot_evento_id_evento_seq OWNED BY public.op_ot_evento.id_evento;


--
-- TOC entry 277 (class 1259 OID 19712)
-- Name: op_ot_evidencia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.op_ot_evidencia (
    id_evidencia bigint NOT NULL,
    id_ot bigint NOT NULL,
    id_ot_formulario bigint,
    tipo_foto character varying(50) NOT NULL,
    url_archivo text NOT NULL,
    nombre_archivo character varying(255),
    tamano_bytes integer,
    latitud_foto numeric(10,8),
    longitud_foto numeric(11,8),
    tomada_offline boolean DEFAULT false NOT NULL,
    sincronizada boolean DEFAULT false NOT NULL,
    id_usuario bigint,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.op_ot_evidencia OWNER TO postgres;

--
-- TOC entry 276 (class 1259 OID 19711)
-- Name: op_ot_evidencia_id_evidencia_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.op_ot_evidencia_id_evidencia_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.op_ot_evidencia_id_evidencia_seq OWNER TO postgres;

--
-- TOC entry 6465 (class 0 OID 0)
-- Dependencies: 276
-- Name: op_ot_evidencia_id_evidencia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.op_ot_evidencia_id_evidencia_seq OWNED BY public.op_ot_evidencia.id_evidencia;


--
-- TOC entry 271 (class 1259 OID 19616)
-- Name: op_ot_formulario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.op_ot_formulario (
    id_ot_formulario bigint NOT NULL,
    id_ot bigint NOT NULL,
    id_formulario bigint NOT NULL,
    version_formulario integer DEFAULT 1 NOT NULL,
    estado_formulario character varying(20) DEFAULT 'EN_PROGRESO'::character varying NOT NULL,
    fecha_inicio timestamp without time zone,
    fecha_fin timestamp without time zone,
    completado boolean DEFAULT false NOT NULL,
    id_usuario_registro bigint,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.op_ot_formulario OWNER TO postgres;

--
-- TOC entry 270 (class 1259 OID 19615)
-- Name: op_ot_formulario_id_ot_formulario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.op_ot_formulario_id_ot_formulario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.op_ot_formulario_id_ot_formulario_seq OWNER TO postgres;

--
-- TOC entry 6466 (class 0 OID 0)
-- Dependencies: 270
-- Name: op_ot_formulario_id_ot_formulario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.op_ot_formulario_id_ot_formulario_seq OWNED BY public.op_ot_formulario.id_ot_formulario;


--
-- TOC entry 273 (class 1259 OID 19653)
-- Name: op_ot_formulario_respuesta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.op_ot_formulario_respuesta (
    id_respuesta bigint NOT NULL,
    id_ot_formulario bigint NOT NULL,
    id_formulario_campo bigint NOT NULL,
    codigo_campo character varying(50) NOT NULL,
    valor_texto text,
    valor_numero integer,
    valor_decimal numeric(15,4),
    valor_fecha date,
    valor_booleano boolean,
    valor_json jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.op_ot_formulario_respuesta OWNER TO postgres;

--
-- TOC entry 272 (class 1259 OID 19652)
-- Name: op_ot_formulario_respuesta_id_respuesta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.op_ot_formulario_respuesta_id_respuesta_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.op_ot_formulario_respuesta_id_respuesta_seq OWNER TO postgres;

--
-- TOC entry 6467 (class 0 OID 0)
-- Dependencies: 272
-- Name: op_ot_formulario_respuesta_id_respuesta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.op_ot_formulario_respuesta_id_respuesta_seq OWNED BY public.op_ot_formulario_respuesta.id_respuesta;


--
-- TOC entry 275 (class 1259 OID 19680)
-- Name: op_ot_validacion_foto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.op_ot_validacion_foto (
    id_validacion_foto bigint NOT NULL,
    id_ot bigint NOT NULL,
    estado_validacion character varying(20) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    bloqueada boolean DEFAULT false NOT NULL,
    fecha_validacion timestamp without time zone,
    resultado_json jsonb,
    fotos_requeridas_json jsonb,
    fotos_encontradas_json jsonb,
    fotos_faltantes_json jsonb,
    mensaje_error text,
    intentos integer DEFAULT 0 NOT NULL,
    validado_por_proceso boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.op_ot_validacion_foto OWNER TO postgres;

--
-- TOC entry 274 (class 1259 OID 19679)
-- Name: op_ot_validacion_foto_id_validacion_foto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.op_ot_validacion_foto_id_validacion_foto_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.op_ot_validacion_foto_id_validacion_foto_seq OWNER TO postgres;

--
-- TOC entry 6468 (class 0 OID 0)
-- Dependencies: 274
-- Name: op_ot_validacion_foto_id_validacion_foto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.op_ot_validacion_foto_id_validacion_foto_seq OWNED BY public.op_ot_validacion_foto.id_validacion_foto;


--
-- TOC entry 233 (class 1259 OID 19011)
-- Name: rrhh_capataz; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rrhh_capataz (
    id_capataz bigint NOT NULL,
    id_usuario bigint NOT NULL,
    id_trabajador bigint NOT NULL,
    codigo_capataz character varying(20) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rrhh_capataz OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 19010)
-- Name: rrhh_capataz_id_capataz_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rrhh_capataz_id_capataz_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rrhh_capataz_id_capataz_seq OWNER TO postgres;

--
-- TOC entry 6469 (class 0 OID 0)
-- Dependencies: 232
-- Name: rrhh_capataz_id_capataz_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rrhh_capataz_id_capataz_seq OWNED BY public.rrhh_capataz.id_capataz;


--
-- TOC entry 231 (class 1259 OID 18989)
-- Name: rrhh_trabajador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rrhh_trabajador (
    id_trabajador bigint NOT NULL,
    dni character varying(8) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    nombre_completo character varying(210) GENERATED ALWAYS AS ((((nombres)::text || ' '::text) || (apellidos)::text)) STORED,
    cargo character varying(100),
    telefono character varying(15),
    foto_url text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rrhh_trabajador OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 18988)
-- Name: rrhh_trabajador_id_trabajador_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rrhh_trabajador_id_trabajador_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rrhh_trabajador_id_trabajador_seq OWNER TO postgres;

--
-- TOC entry 6470 (class 0 OID 0)
-- Dependencies: 230
-- Name: rrhh_trabajador_id_trabajador_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rrhh_trabajador_id_trabajador_seq OWNED BY public.rrhh_trabajador.id_trabajador;


--
-- TOC entry 227 (class 1259 OID 18940)
-- Name: seg_rol; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seg_rol (
    id_rol bigint NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.seg_rol OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 18939)
-- Name: seg_rol_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seg_rol_id_rol_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seg_rol_id_rol_seq OWNER TO postgres;

--
-- TOC entry 6471 (class 0 OID 0)
-- Dependencies: 226
-- Name: seg_rol_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seg_rol_id_rol_seq OWNED BY public.seg_rol.id_rol;


--
-- TOC entry 229 (class 1259 OID 18958)
-- Name: seg_usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seg_usuario (
    id_usuario bigint NOT NULL,
    id_rol bigint NOT NULL,
    username character varying(60) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email character varying(150) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    foto_url text,
    activo boolean DEFAULT true NOT NULL,
    ultimo_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.seg_usuario OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 18957)
-- Name: seg_usuario_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seg_usuario_id_usuario_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seg_usuario_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 6472 (class 0 OID 0)
-- Dependencies: 228
-- Name: seg_usuario_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seg_usuario_id_usuario_seq OWNED BY public.seg_usuario.id_usuario;


--
-- TOC entry 279 (class 1259 OID 19747)
-- Name: sync_operacion_movil; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_operacion_movil (
    id_sync_operacion bigint NOT NULL,
    client_op_uuid uuid NOT NULL,
    id_usuario bigint NOT NULL,
    id_ot bigint,
    tipo_operacion character varying(50) NOT NULL,
    payload_json jsonb NOT NULL,
    estado_sync character varying(20) DEFAULT 'RECIBIDO'::character varying NOT NULL,
    intentos integer DEFAULT 0 NOT NULL,
    mensaje_error text,
    created_at_cliente timestamp without time zone NOT NULL,
    received_at_servidor timestamp without time zone DEFAULT now() NOT NULL,
    processed_at timestamp without time zone
);


ALTER TABLE public.sync_operacion_movil OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 19746)
-- Name: sync_operacion_movil_id_sync_operacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sync_operacion_movil_id_sync_operacion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_operacion_movil_id_sync_operacion_seq OWNER TO postgres;

--
-- TOC entry 6473 (class 0 OID 0)
-- Dependencies: 278
-- Name: sync_operacion_movil_id_sync_operacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sync_operacion_movil_id_sync_operacion_seq OWNED BY public.sync_operacion_movil.id_sync_operacion;


--
-- TOC entry 5971 (class 2604 OID 19154)
-- Name: cat_estado_ot id_estado_ot; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_estado_ot ALTER COLUMN id_estado_ot SET DEFAULT nextval('public.cat_estado_ot_id_estado_ot_seq'::regclass);


--
-- TOC entry 5975 (class 2604 OID 19174)
-- Name: cat_formulario id_formulario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_formulario ALTER COLUMN id_formulario SET DEFAULT nextval('public.cat_formulario_id_formulario_seq'::regclass);


--
-- TOC entry 5979 (class 2604 OID 19200)
-- Name: cat_formulario_campo id_formulario_campo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_formulario_campo ALTER COLUMN id_formulario_campo SET DEFAULT nextval('public.cat_formulario_campo_id_formulario_campo_seq'::regclass);


--
-- TOC entry 5965 (class 2604 OID 19110)
-- Name: cat_subactividad id_subactividad; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_subactividad ALTER COLUMN id_subactividad SET DEFAULT nextval('public.cat_subactividad_id_subactividad_seq'::regclass);


--
-- TOC entry 5968 (class 2604 OID 19128)
-- Name: cat_subactividad_punto_operativo id_subactividad_punto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_subactividad_punto_operativo ALTER COLUMN id_subactividad_punto SET DEFAULT nextval('public.cat_subactividad_punto_operativo_id_subactividad_punto_seq'::regclass);


--
-- TOC entry 5963 (class 2604 OID 19094)
-- Name: cat_tipo_punto_operativo id_tipo_punto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_tipo_punto_operativo ALTER COLUMN id_tipo_punto SET DEFAULT nextval('public.cat_tipo_punto_operativo_id_tipo_punto_seq'::regclass);


--
-- TOC entry 5983 (class 2604 OID 19227)
-- Name: gis_punto_operativo id_punto_operativo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gis_punto_operativo ALTER COLUMN id_punto_operativo SET DEFAULT nextval('public.gis_punto_operativo_id_punto_operativo_seq'::regclass);


--
-- TOC entry 5996 (class 2604 OID 19304)
-- Name: imp_gis_fila id_gis_fila; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_gis_fila ALTER COLUMN id_gis_fila SET DEFAULT nextval('public.imp_gis_fila_id_gis_fila_seq'::regclass);


--
-- TOC entry 5989 (class 2604 OID 19268)
-- Name: imp_gis_lote id_lote; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_gis_lote ALTER COLUMN id_lote SET DEFAULT nextval('public.imp_gis_lote_id_lote_seq'::regclass);


--
-- TOC entry 6010 (class 2604 OID 19389)
-- Name: imp_ot_fila id_fila; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_fila ALTER COLUMN id_fila SET DEFAULT nextval('public.imp_ot_fila_id_fila_seq'::regclass);


--
-- TOC entry 5999 (class 2604 OID 19337)
-- Name: imp_ot_lote id_lote; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_lote ALTER COLUMN id_lote SET DEFAULT nextval('public.imp_ot_lote_id_lote_seq'::regclass);


--
-- TOC entry 6016 (class 2604 OID 19424)
-- Name: imp_ot_validacion id_validacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_validacion ALTER COLUMN id_validacion SET DEFAULT nextval('public.imp_ot_validacion_id_validacion_seq'::regclass);


--
-- TOC entry 5956 (class 2604 OID 19045)
-- Name: op_cuadrilla id_cuadrilla; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_cuadrilla ALTER COLUMN id_cuadrilla SET DEFAULT nextval('public.op_cuadrilla_id_cuadrilla_seq'::regclass);


--
-- TOC entry 5960 (class 2604 OID 19068)
-- Name: op_cuadrilla_miembro_plantilla id_miembro_plantilla; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_cuadrilla_miembro_plantilla ALTER COLUMN id_miembro_plantilla SET DEFAULT nextval('public.op_cuadrilla_miembro_plantilla_id_miembro_plantilla_seq'::regclass);


--
-- TOC entry 6019 (class 2604 OID 19452)
-- Name: op_jornada_campo id_jornada; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_jornada_campo ALTER COLUMN id_jornada SET DEFAULT nextval('public.op_jornada_campo_id_jornada_seq'::regclass);


--
-- TOC entry 6024 (class 2604 OID 19479)
-- Name: op_jornada_miembro id_jornada_miembro; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_jornada_miembro ALTER COLUMN id_jornada_miembro SET DEFAULT nextval('public.op_jornada_miembro_id_jornada_miembro_seq'::regclass);


--
-- TOC entry 6028 (class 2604 OID 19512)
-- Name: op_orden_trabajo id_ot; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo ALTER COLUMN id_ot SET DEFAULT nextval('public.op_orden_trabajo_id_ot_seq'::regclass);


--
-- TOC entry 6035 (class 2604 OID 19591)
-- Name: op_ot_evento id_evento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_evento ALTER COLUMN id_evento SET DEFAULT nextval('public.op_ot_evento_id_evento_seq'::regclass);


--
-- TOC entry 6054 (class 2604 OID 19715)
-- Name: op_ot_evidencia id_evidencia; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_evidencia ALTER COLUMN id_evidencia SET DEFAULT nextval('public.op_ot_evidencia_id_evidencia_seq'::regclass);


--
-- TOC entry 6039 (class 2604 OID 19619)
-- Name: op_ot_formulario id_ot_formulario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_formulario ALTER COLUMN id_ot_formulario SET DEFAULT nextval('public.op_ot_formulario_id_ot_formulario_seq'::regclass);


--
-- TOC entry 6045 (class 2604 OID 19656)
-- Name: op_ot_formulario_respuesta id_respuesta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_formulario_respuesta ALTER COLUMN id_respuesta SET DEFAULT nextval('public.op_ot_formulario_respuesta_id_respuesta_seq'::regclass);


--
-- TOC entry 6047 (class 2604 OID 19683)
-- Name: op_ot_validacion_foto id_validacion_foto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_validacion_foto ALTER COLUMN id_validacion_foto SET DEFAULT nextval('public.op_ot_validacion_foto_id_validacion_foto_seq'::regclass);


--
-- TOC entry 5953 (class 2604 OID 19014)
-- Name: rrhh_capataz id_capataz; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rrhh_capataz ALTER COLUMN id_capataz SET DEFAULT nextval('public.rrhh_capataz_id_capataz_seq'::regclass);


--
-- TOC entry 5948 (class 2604 OID 18992)
-- Name: rrhh_trabajador id_trabajador; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rrhh_trabajador ALTER COLUMN id_trabajador SET DEFAULT nextval('public.rrhh_trabajador_id_trabajador_seq'::regclass);


--
-- TOC entry 5941 (class 2604 OID 18943)
-- Name: seg_rol id_rol; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seg_rol ALTER COLUMN id_rol SET DEFAULT nextval('public.seg_rol_id_rol_seq'::regclass);


--
-- TOC entry 5944 (class 2604 OID 18961)
-- Name: seg_usuario id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seg_usuario ALTER COLUMN id_usuario SET DEFAULT nextval('public.seg_usuario_id_usuario_seq'::regclass);


--
-- TOC entry 6058 (class 2604 OID 19750)
-- Name: sync_operacion_movil id_sync_operacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_operacion_movil ALTER COLUMN id_sync_operacion SET DEFAULT nextval('public.sync_operacion_movil_id_sync_operacion_seq'::regclass);


--
-- TOC entry 6405 (class 0 OID 19151)
-- Dependencies: 245
-- Data for Name: cat_estado_ot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cat_estado_ot (id_estado_ot, codigo, nombre, descripcion, es_final, orden, activo) FROM stdin;
1	PENDIENTE	Pendiente	\N	f	1	t
2	EN_PROGRESO	En Progreso	\N	f	2	t
3	OBSERVADA	Observada	\N	f	3	t
4	COMPLETADA	Completada	\N	t	4	t
5	ANULADA	Anulada	\N	t	5	t
\.


--
-- TOC entry 6407 (class 0 OID 19171)
-- Dependencies: 247
-- Data for Name: cat_formulario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cat_formulario (id_formulario, id_subactividad, codigo, nombre, descripcion, version, activo, created_at) FROM stdin;
\.


--
-- TOC entry 6409 (class 0 OID 19197)
-- Dependencies: 249
-- Data for Name: cat_formulario_campo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cat_formulario_campo (id_formulario_campo, id_formulario, codigo_campo, nombre_campo, tipo_dato, obligatorio, orden, opciones_json, activo) FROM stdin;
\.


--
-- TOC entry 6401 (class 0 OID 19107)
-- Dependencies: 241
-- Data for Name: cat_subactividad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cat_subactividad (id_subactividad, codigo, nombre, descripcion, activo, created_at) FROM stdin;
\.


--
-- TOC entry 6403 (class 0 OID 19125)
-- Dependencies: 243
-- Data for Name: cat_subactividad_punto_operativo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cat_subactividad_punto_operativo (id_subactividad_punto, id_subactividad, id_tipo_punto, activo, created_at) FROM stdin;
\.


--
-- TOC entry 6399 (class 0 OID 19091)
-- Dependencies: 239
-- Data for Name: cat_tipo_punto_operativo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cat_tipo_punto_operativo (id_tipo_punto, codigo, nombre, descripcion, activo) FROM stdin;
1	VCA	Válvula / Cámara de Agua	\N	t
2	HIA	Hidrante	\N	t
3	CIVIL	Obra Civil General	\N	t
\.


--
-- TOC entry 6411 (class 0 OID 19224)
-- Dependencies: 251
-- Data for Name: gis_punto_operativo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gis_punto_operativo (id_punto_operativo, id_tipo_punto, codigo_punto, nis, direccion, localidad, distrito, sector, latitud, longitud, geom, origen_registro, estado_validacion_gis, observacion, id_gis_lote, creado_por, validado_por, created_at, updated_at, validated_at, activo) FROM stdin;
\.


--
-- TOC entry 6415 (class 0 OID 19301)
-- Dependencies: 255
-- Data for Name: imp_gis_fila; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.imp_gis_fila (id_gis_fila, id_lote, numero_fila, codigo_punto, nis, direccion, localidad, distrito, sector, longitud, latitud, tipo_punto, estado_fila, mensaje_error, id_punto_operativo, created_at) FROM stdin;
\.


--
-- TOC entry 6413 (class 0 OID 19265)
-- Dependencies: 253
-- Data for Name: imp_gis_lote; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.imp_gis_lote (id_lote, tipo_catalogo, nombre_archivo, archivo_url, id_usuario, estado, total_registros, registros_ok, registros_error, observacion, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 6419 (class 0 OID 19386)
-- Dependencies: 259
-- Data for Name: imp_ot_fila; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.imp_ot_fila (id_fila, id_lote, numero_fila_excel, sgio, nis, hia_codigo, vca_codigo, direccion_excel, localidad_excel, distrito_excel, sector_excel, fecha_programada, estado_validacion, mensaje_validacion, id_punto_operativo_resuelto, requiere_revision, requiere_coordenada_manual, latitud_manual, longitud_manual, direccion_manual, referencia_manual, observacion_manual, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 6417 (class 0 OID 19334)
-- Dependencies: 257
-- Data for Name: imp_ot_lote; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.imp_ot_lote (id_lote, nombre_archivo, archivo_url, fecha_carga, periodo, fecha_programada, id_supervisor_usuario, id_subactividad, id_tipo_punto, id_capataz, estado_lote, total_filas, filas_correctas, filas_advertencia, filas_error, filas_duplicadas, filas_coord_manual, observacion, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 6421 (class 0 OID 19421)
-- Dependencies: 261
-- Data for Name: imp_ot_validacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.imp_ot_validacion (id_validacion, id_fila, codigo_validacion, tipo_validacion, mensaje, resuelto, resuelto_por, fecha_resolucion, created_at) FROM stdin;
\.


--
-- TOC entry 6395 (class 0 OID 19042)
-- Dependencies: 235
-- Data for Name: op_cuadrilla; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.op_cuadrilla (id_cuadrilla, id_capataz, nombre, activo, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 6397 (class 0 OID 19065)
-- Dependencies: 237
-- Data for Name: op_cuadrilla_miembro_plantilla; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.op_cuadrilla_miembro_plantilla (id_miembro_plantilla, id_cuadrilla, id_trabajador, cargo_en_cuadrilla, activo, created_at) FROM stdin;
\.


--
-- TOC entry 6423 (class 0 OID 19449)
-- Dependencies: 263
-- Data for Name: op_jornada_campo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.op_jornada_campo (id_jornada, id_capataz, fecha_jornada, estado, hora_inicio, hora_fin, confirmada, observacion, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 6425 (class 0 OID 19476)
-- Dependencies: 265
-- Data for Name: op_jornada_miembro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.op_jornada_miembro (id_jornada_miembro, id_jornada, id_trabajador, dni, nombres, apellidos, cargo, estado_asistencia, es_reemplazo, observacion, created_at) FROM stdin;
\.


--
-- TOC entry 6427 (class 0 OID 19509)
-- Dependencies: 267
-- Data for Name: op_orden_trabajo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.op_orden_trabajo (id_ot, sgio, id_lote, id_fila_importacion, id_subactividad, id_tipo_punto, id_punto_operativo, nis, id_capataz, id_jornada, id_estado_ot, fecha_programada, fecha_inicio, fecha_fin, fecha_cierre, direccion, distrito, sector, latitud, longitud, geom, visible_en_mapa, estado_sincronizacion, estado_validacion_fotos, observacion, created_at, updated_at, cerrada_at, activo) FROM stdin;
\.


--
-- TOC entry 6429 (class 0 OID 19588)
-- Dependencies: 269
-- Data for Name: op_ot_evento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.op_ot_evento (id_evento, id_ot, tipo_evento, estado_anterior, estado_nuevo, descripcion, id_usuario, fecha_evento, origen, created_at) FROM stdin;
\.


--
-- TOC entry 6437 (class 0 OID 19712)
-- Dependencies: 277
-- Data for Name: op_ot_evidencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.op_ot_evidencia (id_evidencia, id_ot, id_ot_formulario, tipo_foto, url_archivo, nombre_archivo, tamano_bytes, latitud_foto, longitud_foto, tomada_offline, sincronizada, id_usuario, created_at) FROM stdin;
\.


--
-- TOC entry 6431 (class 0 OID 19616)
-- Dependencies: 271
-- Data for Name: op_ot_formulario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.op_ot_formulario (id_ot_formulario, id_ot, id_formulario, version_formulario, estado_formulario, fecha_inicio, fecha_fin, completado, id_usuario_registro, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 6433 (class 0 OID 19653)
-- Dependencies: 273
-- Data for Name: op_ot_formulario_respuesta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.op_ot_formulario_respuesta (id_respuesta, id_ot_formulario, id_formulario_campo, codigo_campo, valor_texto, valor_numero, valor_decimal, valor_fecha, valor_booleano, valor_json, created_at) FROM stdin;
\.


--
-- TOC entry 6435 (class 0 OID 19680)
-- Dependencies: 275
-- Data for Name: op_ot_validacion_foto; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.op_ot_validacion_foto (id_validacion_foto, id_ot, estado_validacion, bloqueada, fecha_validacion, resultado_json, fotos_requeridas_json, fotos_encontradas_json, fotos_faltantes_json, mensaje_error, intentos, validado_por_proceso, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 6393 (class 0 OID 19011)
-- Dependencies: 233
-- Data for Name: rrhh_capataz; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rrhh_capataz (id_capataz, id_usuario, id_trabajador, codigo_capataz, activo, created_at) FROM stdin;
\.


--
-- TOC entry 6391 (class 0 OID 18989)
-- Dependencies: 231
-- Data for Name: rrhh_trabajador; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rrhh_trabajador (id_trabajador, dni, nombres, apellidos, cargo, telefono, foto_url, activo, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 6387 (class 0 OID 18940)
-- Dependencies: 227
-- Data for Name: seg_rol; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seg_rol (id_rol, codigo, nombre, descripcion, activo, created_at) FROM stdin;
1	supervisor	Supervisor	Carga OT desde Excel y supervisa el avance del equipo de campo	t	2026-05-13 16:52:10.671849
2	capataz	Capataz	Registra actividades en campo y llena formularios por punto	t	2026-05-13 16:52:10.671849
3	admin	Administrador	Acceso total: reportes, auditoría y gestión del sistema	t	2026-05-13 16:52:10.671849
\.


--
-- TOC entry 6389 (class 0 OID 18958)
-- Dependencies: 229
-- Data for Name: seg_usuario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seg_usuario (id_usuario, id_rol, username, password_hash, email, nombres, apellidos, foto_url, activo, ultimo_login, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5940 (class 0 OID 18138)
-- Dependencies: 222
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 6439 (class 0 OID 19747)
-- Dependencies: 279
-- Data for Name: sync_operacion_movil; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_operacion_movil (id_sync_operacion, client_op_uuid, id_usuario, id_ot, tipo_operacion, payload_json, estado_sync, intentos, mensaje_error, created_at_cliente, received_at_servidor, processed_at) FROM stdin;
\.


--
-- TOC entry 6474 (class 0 OID 0)
-- Dependencies: 244
-- Name: cat_estado_ot_id_estado_ot_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cat_estado_ot_id_estado_ot_seq', 5, true);


--
-- TOC entry 6475 (class 0 OID 0)
-- Dependencies: 248
-- Name: cat_formulario_campo_id_formulario_campo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cat_formulario_campo_id_formulario_campo_seq', 1, false);


--
-- TOC entry 6476 (class 0 OID 0)
-- Dependencies: 246
-- Name: cat_formulario_id_formulario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cat_formulario_id_formulario_seq', 1, false);


--
-- TOC entry 6477 (class 0 OID 0)
-- Dependencies: 240
-- Name: cat_subactividad_id_subactividad_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cat_subactividad_id_subactividad_seq', 1, false);


--
-- TOC entry 6478 (class 0 OID 0)
-- Dependencies: 242
-- Name: cat_subactividad_punto_operativo_id_subactividad_punto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cat_subactividad_punto_operativo_id_subactividad_punto_seq', 1, false);


--
-- TOC entry 6479 (class 0 OID 0)
-- Dependencies: 238
-- Name: cat_tipo_punto_operativo_id_tipo_punto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cat_tipo_punto_operativo_id_tipo_punto_seq', 3, true);


--
-- TOC entry 6480 (class 0 OID 0)
-- Dependencies: 250
-- Name: gis_punto_operativo_id_punto_operativo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gis_punto_operativo_id_punto_operativo_seq', 1, false);


--
-- TOC entry 6481 (class 0 OID 0)
-- Dependencies: 254
-- Name: imp_gis_fila_id_gis_fila_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.imp_gis_fila_id_gis_fila_seq', 1, false);


--
-- TOC entry 6482 (class 0 OID 0)
-- Dependencies: 252
-- Name: imp_gis_lote_id_lote_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.imp_gis_lote_id_lote_seq', 1, false);


--
-- TOC entry 6483 (class 0 OID 0)
-- Dependencies: 258
-- Name: imp_ot_fila_id_fila_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.imp_ot_fila_id_fila_seq', 1, false);


--
-- TOC entry 6484 (class 0 OID 0)
-- Dependencies: 256
-- Name: imp_ot_lote_id_lote_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.imp_ot_lote_id_lote_seq', 1, false);


--
-- TOC entry 6485 (class 0 OID 0)
-- Dependencies: 260
-- Name: imp_ot_validacion_id_validacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.imp_ot_validacion_id_validacion_seq', 1, false);


--
-- TOC entry 6486 (class 0 OID 0)
-- Dependencies: 234
-- Name: op_cuadrilla_id_cuadrilla_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.op_cuadrilla_id_cuadrilla_seq', 1, false);


--
-- TOC entry 6487 (class 0 OID 0)
-- Dependencies: 236
-- Name: op_cuadrilla_miembro_plantilla_id_miembro_plantilla_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.op_cuadrilla_miembro_plantilla_id_miembro_plantilla_seq', 1, false);


--
-- TOC entry 6488 (class 0 OID 0)
-- Dependencies: 262
-- Name: op_jornada_campo_id_jornada_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.op_jornada_campo_id_jornada_seq', 1, false);


--
-- TOC entry 6489 (class 0 OID 0)
-- Dependencies: 264
-- Name: op_jornada_miembro_id_jornada_miembro_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.op_jornada_miembro_id_jornada_miembro_seq', 1, false);


--
-- TOC entry 6490 (class 0 OID 0)
-- Dependencies: 266
-- Name: op_orden_trabajo_id_ot_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.op_orden_trabajo_id_ot_seq', 1, false);


--
-- TOC entry 6491 (class 0 OID 0)
-- Dependencies: 268
-- Name: op_ot_evento_id_evento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.op_ot_evento_id_evento_seq', 1, false);


--
-- TOC entry 6492 (class 0 OID 0)
-- Dependencies: 276
-- Name: op_ot_evidencia_id_evidencia_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.op_ot_evidencia_id_evidencia_seq', 1, false);


--
-- TOC entry 6493 (class 0 OID 0)
-- Dependencies: 270
-- Name: op_ot_formulario_id_ot_formulario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.op_ot_formulario_id_ot_formulario_seq', 1, false);


--
-- TOC entry 6494 (class 0 OID 0)
-- Dependencies: 272
-- Name: op_ot_formulario_respuesta_id_respuesta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.op_ot_formulario_respuesta_id_respuesta_seq', 1, false);


--
-- TOC entry 6495 (class 0 OID 0)
-- Dependencies: 274
-- Name: op_ot_validacion_foto_id_validacion_foto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.op_ot_validacion_foto_id_validacion_foto_seq', 1, false);


--
-- TOC entry 6496 (class 0 OID 0)
-- Dependencies: 232
-- Name: rrhh_capataz_id_capataz_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rrhh_capataz_id_capataz_seq', 1, false);


--
-- TOC entry 6497 (class 0 OID 0)
-- Dependencies: 230
-- Name: rrhh_trabajador_id_trabajador_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rrhh_trabajador_id_trabajador_seq', 1, false);


--
-- TOC entry 6498 (class 0 OID 0)
-- Dependencies: 226
-- Name: seg_rol_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seg_rol_id_rol_seq', 3, true);


--
-- TOC entry 6499 (class 0 OID 0)
-- Dependencies: 228
-- Name: seg_usuario_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seg_usuario_id_usuario_seq', 1, false);


--
-- TOC entry 6500 (class 0 OID 0)
-- Dependencies: 278
-- Name: sync_operacion_movil_id_sync_operacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sync_operacion_movil_id_sync_operacion_seq', 1, false);


--
-- TOC entry 6108 (class 2606 OID 19169)
-- Name: cat_estado_ot cat_estado_ot_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_estado_ot
    ADD CONSTRAINT cat_estado_ot_codigo_key UNIQUE (codigo);


--
-- TOC entry 6110 (class 2606 OID 19167)
-- Name: cat_estado_ot cat_estado_ot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_estado_ot
    ADD CONSTRAINT cat_estado_ot_pkey PRIMARY KEY (id_estado_ot);


--
-- TOC entry 6116 (class 2606 OID 19217)
-- Name: cat_formulario_campo cat_formulario_campo_id_formulario_codigo_campo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_formulario_campo
    ADD CONSTRAINT cat_formulario_campo_id_formulario_codigo_campo_key UNIQUE (id_formulario, codigo_campo);


--
-- TOC entry 6118 (class 2606 OID 19215)
-- Name: cat_formulario_campo cat_formulario_campo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_formulario_campo
    ADD CONSTRAINT cat_formulario_campo_pkey PRIMARY KEY (id_formulario_campo);


--
-- TOC entry 6112 (class 2606 OID 19190)
-- Name: cat_formulario cat_formulario_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_formulario
    ADD CONSTRAINT cat_formulario_codigo_key UNIQUE (codigo);


--
-- TOC entry 6114 (class 2606 OID 19188)
-- Name: cat_formulario cat_formulario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_formulario
    ADD CONSTRAINT cat_formulario_pkey PRIMARY KEY (id_formulario);


--
-- TOC entry 6100 (class 2606 OID 19123)
-- Name: cat_subactividad cat_subactividad_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_subactividad
    ADD CONSTRAINT cat_subactividad_codigo_key UNIQUE (codigo);


--
-- TOC entry 6102 (class 2606 OID 19121)
-- Name: cat_subactividad cat_subactividad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_subactividad
    ADD CONSTRAINT cat_subactividad_pkey PRIMARY KEY (id_subactividad);


--
-- TOC entry 6104 (class 2606 OID 19139)
-- Name: cat_subactividad_punto_operativo cat_subactividad_punto_operat_id_subactividad_id_tipo_punto_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_subactividad_punto_operativo
    ADD CONSTRAINT cat_subactividad_punto_operat_id_subactividad_id_tipo_punto_key UNIQUE (id_subactividad, id_tipo_punto);


--
-- TOC entry 6106 (class 2606 OID 19137)
-- Name: cat_subactividad_punto_operativo cat_subactividad_punto_operativo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_subactividad_punto_operativo
    ADD CONSTRAINT cat_subactividad_punto_operativo_pkey PRIMARY KEY (id_subactividad_punto);


--
-- TOC entry 6096 (class 2606 OID 19105)
-- Name: cat_tipo_punto_operativo cat_tipo_punto_operativo_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_tipo_punto_operativo
    ADD CONSTRAINT cat_tipo_punto_operativo_codigo_key UNIQUE (codigo);


--
-- TOC entry 6098 (class 2606 OID 19103)
-- Name: cat_tipo_punto_operativo cat_tipo_punto_operativo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_tipo_punto_operativo
    ADD CONSTRAINT cat_tipo_punto_operativo_pkey PRIMARY KEY (id_tipo_punto);


--
-- TOC entry 6120 (class 2606 OID 19243)
-- Name: gis_punto_operativo gis_punto_operativo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gis_punto_operativo
    ADD CONSTRAINT gis_punto_operativo_pkey PRIMARY KEY (id_punto_operativo);


--
-- TOC entry 6130 (class 2606 OID 19319)
-- Name: imp_gis_fila imp_gis_fila_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_gis_fila
    ADD CONSTRAINT imp_gis_fila_pkey PRIMARY KEY (id_gis_fila);


--
-- TOC entry 6126 (class 2606 OID 19288)
-- Name: imp_gis_lote imp_gis_lote_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_gis_lote
    ADD CONSTRAINT imp_gis_lote_pkey PRIMARY KEY (id_lote);


--
-- TOC entry 6134 (class 2606 OID 19407)
-- Name: imp_ot_fila imp_ot_fila_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_fila
    ADD CONSTRAINT imp_ot_fila_pkey PRIMARY KEY (id_fila);


--
-- TOC entry 6136 (class 2606 OID 19409)
-- Name: imp_ot_fila imp_ot_fila_sgio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_fila
    ADD CONSTRAINT imp_ot_fila_sgio_key UNIQUE (sgio);


--
-- TOC entry 6132 (class 2606 OID 19364)
-- Name: imp_ot_lote imp_ot_lote_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_lote
    ADD CONSTRAINT imp_ot_lote_pkey PRIMARY KEY (id_lote);


--
-- TOC entry 6138 (class 2606 OID 19437)
-- Name: imp_ot_validacion imp_ot_validacion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_validacion
    ADD CONSTRAINT imp_ot_validacion_pkey PRIMARY KEY (id_validacion);


--
-- TOC entry 6088 (class 2606 OID 19058)
-- Name: op_cuadrilla op_cuadrilla_id_capataz_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_cuadrilla
    ADD CONSTRAINT op_cuadrilla_id_capataz_key UNIQUE (id_capataz);


--
-- TOC entry 6092 (class 2606 OID 19079)
-- Name: op_cuadrilla_miembro_plantilla op_cuadrilla_miembro_plantilla_id_cuadrilla_id_trabajador_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_cuadrilla_miembro_plantilla
    ADD CONSTRAINT op_cuadrilla_miembro_plantilla_id_cuadrilla_id_trabajador_key UNIQUE (id_cuadrilla, id_trabajador);


--
-- TOC entry 6094 (class 2606 OID 19077)
-- Name: op_cuadrilla_miembro_plantilla op_cuadrilla_miembro_plantilla_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_cuadrilla_miembro_plantilla
    ADD CONSTRAINT op_cuadrilla_miembro_plantilla_pkey PRIMARY KEY (id_miembro_plantilla);


--
-- TOC entry 6090 (class 2606 OID 19056)
-- Name: op_cuadrilla op_cuadrilla_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_cuadrilla
    ADD CONSTRAINT op_cuadrilla_pkey PRIMARY KEY (id_cuadrilla);


--
-- TOC entry 6140 (class 2606 OID 19469)
-- Name: op_jornada_campo op_jornada_campo_id_capataz_fecha_jornada_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_jornada_campo
    ADD CONSTRAINT op_jornada_campo_id_capataz_fecha_jornada_key UNIQUE (id_capataz, fecha_jornada);


--
-- TOC entry 6142 (class 2606 OID 19467)
-- Name: op_jornada_campo op_jornada_campo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_jornada_campo
    ADD CONSTRAINT op_jornada_campo_pkey PRIMARY KEY (id_jornada);


--
-- TOC entry 6144 (class 2606 OID 19497)
-- Name: op_jornada_miembro op_jornada_miembro_id_jornada_id_trabajador_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_jornada_miembro
    ADD CONSTRAINT op_jornada_miembro_id_jornada_id_trabajador_key UNIQUE (id_jornada, id_trabajador);


--
-- TOC entry 6146 (class 2606 OID 19495)
-- Name: op_jornada_miembro op_jornada_miembro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_jornada_miembro
    ADD CONSTRAINT op_jornada_miembro_pkey PRIMARY KEY (id_jornada_miembro);


--
-- TOC entry 6154 (class 2606 OID 19538)
-- Name: op_orden_trabajo op_orden_trabajo_id_fila_importacion_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo
    ADD CONSTRAINT op_orden_trabajo_id_fila_importacion_key UNIQUE (id_fila_importacion);


--
-- TOC entry 6156 (class 2606 OID 19534)
-- Name: op_orden_trabajo op_orden_trabajo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo
    ADD CONSTRAINT op_orden_trabajo_pkey PRIMARY KEY (id_ot);


--
-- TOC entry 6158 (class 2606 OID 19536)
-- Name: op_orden_trabajo op_orden_trabajo_sgio_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo
    ADD CONSTRAINT op_orden_trabajo_sgio_key UNIQUE (sgio);


--
-- TOC entry 6160 (class 2606 OID 19604)
-- Name: op_ot_evento op_ot_evento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_evento
    ADD CONSTRAINT op_ot_evento_pkey PRIMARY KEY (id_evento);


--
-- TOC entry 6175 (class 2606 OID 19729)
-- Name: op_ot_evidencia op_ot_evidencia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_evidencia
    ADD CONSTRAINT op_ot_evidencia_pkey PRIMARY KEY (id_evidencia);


--
-- TOC entry 6162 (class 2606 OID 19636)
-- Name: op_ot_formulario op_ot_formulario_id_ot_id_formulario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_formulario
    ADD CONSTRAINT op_ot_formulario_id_ot_id_formulario_key UNIQUE (id_ot, id_formulario);


--
-- TOC entry 6164 (class 2606 OID 19634)
-- Name: op_ot_formulario op_ot_formulario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_formulario
    ADD CONSTRAINT op_ot_formulario_pkey PRIMARY KEY (id_ot_formulario);


--
-- TOC entry 6166 (class 2606 OID 19668)
-- Name: op_ot_formulario_respuesta op_ot_formulario_respuesta_id_ot_formulario_id_formulario_c_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_formulario_respuesta
    ADD CONSTRAINT op_ot_formulario_respuesta_id_ot_formulario_id_formulario_c_key UNIQUE (id_ot_formulario, id_formulario_campo);


--
-- TOC entry 6168 (class 2606 OID 19666)
-- Name: op_ot_formulario_respuesta op_ot_formulario_respuesta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_formulario_respuesta
    ADD CONSTRAINT op_ot_formulario_respuesta_pkey PRIMARY KEY (id_respuesta);


--
-- TOC entry 6170 (class 2606 OID 19703)
-- Name: op_ot_validacion_foto op_ot_validacion_foto_id_ot_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_validacion_foto
    ADD CONSTRAINT op_ot_validacion_foto_id_ot_key UNIQUE (id_ot);


--
-- TOC entry 6172 (class 2606 OID 19701)
-- Name: op_ot_validacion_foto op_ot_validacion_foto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_validacion_foto
    ADD CONSTRAINT op_ot_validacion_foto_pkey PRIMARY KEY (id_validacion_foto);


--
-- TOC entry 6080 (class 2606 OID 19030)
-- Name: rrhh_capataz rrhh_capataz_codigo_capataz_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rrhh_capataz
    ADD CONSTRAINT rrhh_capataz_codigo_capataz_key UNIQUE (codigo_capataz);


--
-- TOC entry 6082 (class 2606 OID 19028)
-- Name: rrhh_capataz rrhh_capataz_id_trabajador_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rrhh_capataz
    ADD CONSTRAINT rrhh_capataz_id_trabajador_key UNIQUE (id_trabajador);


--
-- TOC entry 6084 (class 2606 OID 19026)
-- Name: rrhh_capataz rrhh_capataz_id_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rrhh_capataz
    ADD CONSTRAINT rrhh_capataz_id_usuario_key UNIQUE (id_usuario);


--
-- TOC entry 6086 (class 2606 OID 19024)
-- Name: rrhh_capataz rrhh_capataz_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rrhh_capataz
    ADD CONSTRAINT rrhh_capataz_pkey PRIMARY KEY (id_capataz);


--
-- TOC entry 6076 (class 2606 OID 19009)
-- Name: rrhh_trabajador rrhh_trabajador_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rrhh_trabajador
    ADD CONSTRAINT rrhh_trabajador_dni_key UNIQUE (dni);


--
-- TOC entry 6078 (class 2606 OID 19007)
-- Name: rrhh_trabajador rrhh_trabajador_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rrhh_trabajador
    ADD CONSTRAINT rrhh_trabajador_pkey PRIMARY KEY (id_trabajador);


--
-- TOC entry 6066 (class 2606 OID 18956)
-- Name: seg_rol seg_rol_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seg_rol
    ADD CONSTRAINT seg_rol_codigo_key UNIQUE (codigo);


--
-- TOC entry 6068 (class 2606 OID 18954)
-- Name: seg_rol seg_rol_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seg_rol
    ADD CONSTRAINT seg_rol_pkey PRIMARY KEY (id_rol);


--
-- TOC entry 6070 (class 2606 OID 18982)
-- Name: seg_usuario seg_usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seg_usuario
    ADD CONSTRAINT seg_usuario_email_key UNIQUE (email);


--
-- TOC entry 6072 (class 2606 OID 18978)
-- Name: seg_usuario seg_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seg_usuario
    ADD CONSTRAINT seg_usuario_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 6074 (class 2606 OID 18980)
-- Name: seg_usuario seg_usuario_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seg_usuario
    ADD CONSTRAINT seg_usuario_username_key UNIQUE (username);


--
-- TOC entry 6179 (class 2606 OID 19768)
-- Name: sync_operacion_movil sync_operacion_movil_client_op_uuid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_operacion_movil
    ADD CONSTRAINT sync_operacion_movil_client_op_uuid_key UNIQUE (client_op_uuid);


--
-- TOC entry 6181 (class 2606 OID 19766)
-- Name: sync_operacion_movil sync_operacion_movil_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_operacion_movil
    ADD CONSTRAINT sync_operacion_movil_pkey PRIMARY KEY (id_sync_operacion);


--
-- TOC entry 6173 (class 1259 OID 19745)
-- Name: idx_evidencia_ot; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evidencia_ot ON public.op_ot_evidencia USING btree (id_ot);


--
-- TOC entry 6121 (class 1259 OID 19261)
-- Name: idx_gis_codigo_punto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gis_codigo_punto ON public.gis_punto_operativo USING btree (codigo_punto);


--
-- TOC entry 6127 (class 1259 OID 19331)
-- Name: idx_gis_fila_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gis_fila_codigo ON public.imp_gis_fila USING btree (codigo_punto);


--
-- TOC entry 6128 (class 1259 OID 19330)
-- Name: idx_gis_fila_lote; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gis_fila_lote ON public.imp_gis_fila USING btree (id_lote);


--
-- TOC entry 6122 (class 1259 OID 19259)
-- Name: idx_gis_geom; Type: INDEX; Schema: public; Owner: postgres
--



--
-- TOC entry 6124 (class 1259 OID 19294)
-- Name: idx_gis_lote_activo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_gis_lote_activo ON public.imp_gis_lote USING btree (tipo_catalogo) WHERE ((estado)::text = 'ACTIVO'::text);


--
-- TOC entry 6123 (class 1259 OID 19260)
-- Name: idx_gis_nis; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gis_nis ON public.gis_punto_operativo USING btree (nis);


--
-- TOC entry 6147 (class 1259 OID 19579)
-- Name: idx_ot_capataz; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ot_capataz ON public.op_orden_trabajo USING btree (id_capataz);


--
-- TOC entry 6148 (class 1259 OID 19581)
-- Name: idx_ot_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ot_estado ON public.op_orden_trabajo USING btree (id_estado_ot);


--
-- TOC entry 6149 (class 1259 OID 19582)
-- Name: idx_ot_fecha_cierre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ot_fecha_cierre ON public.op_orden_trabajo USING btree (fecha_cierre);


--
-- TOC entry 6150 (class 1259 OID 19584)
-- Name: idx_ot_geom; Type: INDEX; Schema: public; Owner: postgres
--



--
-- TOC entry 6151 (class 1259 OID 19583)
-- Name: idx_ot_jornada; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ot_jornada ON public.op_orden_trabajo USING btree (id_jornada);


--
-- TOC entry 6152 (class 1259 OID 19580)
-- Name: idx_ot_mapa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ot_mapa ON public.op_orden_trabajo USING btree (id_capataz, visible_en_mapa);


--
-- TOC entry 6176 (class 1259 OID 19779)
-- Name: idx_sync_pendientes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_pendientes ON public.sync_operacion_movil USING btree (estado_sync, created_at_cliente) WHERE ((estado_sync)::text = ANY ((ARRAY['RECIBIDO'::character varying, 'ERROR'::character varying])::text[]));


--
-- TOC entry 6177 (class 1259 OID 19780)
-- Name: idx_sync_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sync_usuario ON public.sync_operacion_movil USING btree (id_usuario);


--
-- TOC entry 6233 (class 2620 OID 19710)
-- Name: op_ot_validacion_foto trg_actualizar_bloqueo_foto; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_actualizar_bloqueo_foto BEFORE INSERT OR UPDATE OF fotos_faltantes_json ON public.op_ot_validacion_foto FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_bloqueo_foto();


--
-- TOC entry 6232 (class 2620 OID 19586)
-- Name: op_orden_trabajo trg_gestionar_cierre_ot; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_gestionar_cierre_ot BEFORE UPDATE ON public.op_orden_trabajo FOR EACH ROW EXECUTE FUNCTION public.fn_gestionar_cierre_ot();


--
-- TOC entry 6231 (class 2620 OID 19263)
-- Name: gis_punto_operativo trg_sync_geom_punto; Type: TRIGGER; Schema: public; Owner: postgres
--



--
-- TOC entry 6191 (class 2606 OID 19218)
-- Name: cat_formulario_campo cat_formulario_campo_id_formulario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_formulario_campo
    ADD CONSTRAINT cat_formulario_campo_id_formulario_fkey FOREIGN KEY (id_formulario) REFERENCES public.cat_formulario(id_formulario);


--
-- TOC entry 6190 (class 2606 OID 19191)
-- Name: cat_formulario cat_formulario_id_subactividad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_formulario
    ADD CONSTRAINT cat_formulario_id_subactividad_fkey FOREIGN KEY (id_subactividad) REFERENCES public.cat_subactividad(id_subactividad);


--
-- TOC entry 6188 (class 2606 OID 19140)
-- Name: cat_subactividad_punto_operativo cat_subactividad_punto_operativo_id_subactividad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_subactividad_punto_operativo
    ADD CONSTRAINT cat_subactividad_punto_operativo_id_subactividad_fkey FOREIGN KEY (id_subactividad) REFERENCES public.cat_subactividad(id_subactividad);


--
-- TOC entry 6189 (class 2606 OID 19145)
-- Name: cat_subactividad_punto_operativo cat_subactividad_punto_operativo_id_tipo_punto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cat_subactividad_punto_operativo
    ADD CONSTRAINT cat_subactividad_punto_operativo_id_tipo_punto_fkey FOREIGN KEY (id_tipo_punto) REFERENCES public.cat_tipo_punto_operativo(id_tipo_punto);


--
-- TOC entry 6192 (class 2606 OID 19295)
-- Name: gis_punto_operativo fk_gis_punto_lote; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gis_punto_operativo
    ADD CONSTRAINT fk_gis_punto_lote FOREIGN KEY (id_gis_lote) REFERENCES public.imp_gis_lote(id_lote);


--
-- TOC entry 6193 (class 2606 OID 19249)
-- Name: gis_punto_operativo gis_punto_operativo_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gis_punto_operativo
    ADD CONSTRAINT gis_punto_operativo_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.seg_usuario(id_usuario);


--
-- TOC entry 6194 (class 2606 OID 19244)
-- Name: gis_punto_operativo gis_punto_operativo_id_tipo_punto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gis_punto_operativo
    ADD CONSTRAINT gis_punto_operativo_id_tipo_punto_fkey FOREIGN KEY (id_tipo_punto) REFERENCES public.cat_tipo_punto_operativo(id_tipo_punto);


--
-- TOC entry 6195 (class 2606 OID 19254)
-- Name: gis_punto_operativo gis_punto_operativo_validado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gis_punto_operativo
    ADD CONSTRAINT gis_punto_operativo_validado_por_fkey FOREIGN KEY (validado_por) REFERENCES public.seg_usuario(id_usuario);


--
-- TOC entry 6197 (class 2606 OID 19320)
-- Name: imp_gis_fila imp_gis_fila_id_lote_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_gis_fila
    ADD CONSTRAINT imp_gis_fila_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.imp_gis_lote(id_lote);


--
-- TOC entry 6198 (class 2606 OID 19325)
-- Name: imp_gis_fila imp_gis_fila_id_punto_operativo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_gis_fila
    ADD CONSTRAINT imp_gis_fila_id_punto_operativo_fkey FOREIGN KEY (id_punto_operativo) REFERENCES public.gis_punto_operativo(id_punto_operativo);


--
-- TOC entry 6196 (class 2606 OID 19289)
-- Name: imp_gis_lote imp_gis_lote_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_gis_lote
    ADD CONSTRAINT imp_gis_lote_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.seg_usuario(id_usuario);


--
-- TOC entry 6203 (class 2606 OID 19410)
-- Name: imp_ot_fila imp_ot_fila_id_lote_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_fila
    ADD CONSTRAINT imp_ot_fila_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.imp_ot_lote(id_lote);


--
-- TOC entry 6204 (class 2606 OID 19415)
-- Name: imp_ot_fila imp_ot_fila_id_punto_operativo_resuelto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_fila
    ADD CONSTRAINT imp_ot_fila_id_punto_operativo_resuelto_fkey FOREIGN KEY (id_punto_operativo_resuelto) REFERENCES public.gis_punto_operativo(id_punto_operativo);


--
-- TOC entry 6199 (class 2606 OID 19380)
-- Name: imp_ot_lote imp_ot_lote_id_capataz_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_lote
    ADD CONSTRAINT imp_ot_lote_id_capataz_fkey FOREIGN KEY (id_capataz) REFERENCES public.rrhh_capataz(id_capataz);


--
-- TOC entry 6200 (class 2606 OID 19370)
-- Name: imp_ot_lote imp_ot_lote_id_subactividad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_lote
    ADD CONSTRAINT imp_ot_lote_id_subactividad_fkey FOREIGN KEY (id_subactividad) REFERENCES public.cat_subactividad(id_subactividad);


--
-- TOC entry 6201 (class 2606 OID 19365)
-- Name: imp_ot_lote imp_ot_lote_id_supervisor_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_lote
    ADD CONSTRAINT imp_ot_lote_id_supervisor_usuario_fkey FOREIGN KEY (id_supervisor_usuario) REFERENCES public.seg_usuario(id_usuario);


--
-- TOC entry 6202 (class 2606 OID 19375)
-- Name: imp_ot_lote imp_ot_lote_id_tipo_punto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_lote
    ADD CONSTRAINT imp_ot_lote_id_tipo_punto_fkey FOREIGN KEY (id_tipo_punto) REFERENCES public.cat_tipo_punto_operativo(id_tipo_punto);


--
-- TOC entry 6205 (class 2606 OID 19438)
-- Name: imp_ot_validacion imp_ot_validacion_id_fila_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_validacion
    ADD CONSTRAINT imp_ot_validacion_id_fila_fkey FOREIGN KEY (id_fila) REFERENCES public.imp_ot_fila(id_fila);


--
-- TOC entry 6206 (class 2606 OID 19443)
-- Name: imp_ot_validacion imp_ot_validacion_resuelto_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.imp_ot_validacion
    ADD CONSTRAINT imp_ot_validacion_resuelto_por_fkey FOREIGN KEY (resuelto_por) REFERENCES public.seg_usuario(id_usuario);


--
-- TOC entry 6185 (class 2606 OID 19059)
-- Name: op_cuadrilla op_cuadrilla_id_capataz_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_cuadrilla
    ADD CONSTRAINT op_cuadrilla_id_capataz_fkey FOREIGN KEY (id_capataz) REFERENCES public.rrhh_capataz(id_capataz);


--
-- TOC entry 6186 (class 2606 OID 19080)
-- Name: op_cuadrilla_miembro_plantilla op_cuadrilla_miembro_plantilla_id_cuadrilla_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_cuadrilla_miembro_plantilla
    ADD CONSTRAINT op_cuadrilla_miembro_plantilla_id_cuadrilla_fkey FOREIGN KEY (id_cuadrilla) REFERENCES public.op_cuadrilla(id_cuadrilla);


--
-- TOC entry 6187 (class 2606 OID 19085)
-- Name: op_cuadrilla_miembro_plantilla op_cuadrilla_miembro_plantilla_id_trabajador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_cuadrilla_miembro_plantilla
    ADD CONSTRAINT op_cuadrilla_miembro_plantilla_id_trabajador_fkey FOREIGN KEY (id_trabajador) REFERENCES public.rrhh_trabajador(id_trabajador);


--
-- TOC entry 6207 (class 2606 OID 19470)
-- Name: op_jornada_campo op_jornada_campo_id_capataz_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_jornada_campo
    ADD CONSTRAINT op_jornada_campo_id_capataz_fkey FOREIGN KEY (id_capataz) REFERENCES public.rrhh_capataz(id_capataz);


--
-- TOC entry 6208 (class 2606 OID 19498)
-- Name: op_jornada_miembro op_jornada_miembro_id_jornada_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_jornada_miembro
    ADD CONSTRAINT op_jornada_miembro_id_jornada_fkey FOREIGN KEY (id_jornada) REFERENCES public.op_jornada_campo(id_jornada);


--
-- TOC entry 6209 (class 2606 OID 19503)
-- Name: op_jornada_miembro op_jornada_miembro_id_trabajador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_jornada_miembro
    ADD CONSTRAINT op_jornada_miembro_id_trabajador_fkey FOREIGN KEY (id_trabajador) REFERENCES public.rrhh_trabajador(id_trabajador);


--
-- TOC entry 6210 (class 2606 OID 19564)
-- Name: op_orden_trabajo op_orden_trabajo_id_capataz_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo
    ADD CONSTRAINT op_orden_trabajo_id_capataz_fkey FOREIGN KEY (id_capataz) REFERENCES public.rrhh_capataz(id_capataz);


--
-- TOC entry 6211 (class 2606 OID 19574)
-- Name: op_orden_trabajo op_orden_trabajo_id_estado_ot_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo
    ADD CONSTRAINT op_orden_trabajo_id_estado_ot_fkey FOREIGN KEY (id_estado_ot) REFERENCES public.cat_estado_ot(id_estado_ot);


--
-- TOC entry 6212 (class 2606 OID 19544)
-- Name: op_orden_trabajo op_orden_trabajo_id_fila_importacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo
    ADD CONSTRAINT op_orden_trabajo_id_fila_importacion_fkey FOREIGN KEY (id_fila_importacion) REFERENCES public.imp_ot_fila(id_fila);


--
-- TOC entry 6213 (class 2606 OID 19569)
-- Name: op_orden_trabajo op_orden_trabajo_id_jornada_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo
    ADD CONSTRAINT op_orden_trabajo_id_jornada_fkey FOREIGN KEY (id_jornada) REFERENCES public.op_jornada_campo(id_jornada);


--
-- TOC entry 6214 (class 2606 OID 19539)
-- Name: op_orden_trabajo op_orden_trabajo_id_lote_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo
    ADD CONSTRAINT op_orden_trabajo_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.imp_ot_lote(id_lote);


--
-- TOC entry 6215 (class 2606 OID 19559)
-- Name: op_orden_trabajo op_orden_trabajo_id_punto_operativo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo
    ADD CONSTRAINT op_orden_trabajo_id_punto_operativo_fkey FOREIGN KEY (id_punto_operativo) REFERENCES public.gis_punto_operativo(id_punto_operativo);


--
-- TOC entry 6216 (class 2606 OID 19549)
-- Name: op_orden_trabajo op_orden_trabajo_id_subactividad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo
    ADD CONSTRAINT op_orden_trabajo_id_subactividad_fkey FOREIGN KEY (id_subactividad) REFERENCES public.cat_subactividad(id_subactividad);


--
-- TOC entry 6217 (class 2606 OID 19554)
-- Name: op_orden_trabajo op_orden_trabajo_id_tipo_punto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_orden_trabajo
    ADD CONSTRAINT op_orden_trabajo_id_tipo_punto_fkey FOREIGN KEY (id_tipo_punto) REFERENCES public.cat_tipo_punto_operativo(id_tipo_punto);


--
-- TOC entry 6218 (class 2606 OID 19605)
-- Name: op_ot_evento op_ot_evento_id_ot_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_evento
    ADD CONSTRAINT op_ot_evento_id_ot_fkey FOREIGN KEY (id_ot) REFERENCES public.op_orden_trabajo(id_ot);


--
-- TOC entry 6219 (class 2606 OID 19610)
-- Name: op_ot_evento op_ot_evento_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_evento
    ADD CONSTRAINT op_ot_evento_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.seg_usuario(id_usuario);


--
-- TOC entry 6226 (class 2606 OID 19730)
-- Name: op_ot_evidencia op_ot_evidencia_id_ot_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_evidencia
    ADD CONSTRAINT op_ot_evidencia_id_ot_fkey FOREIGN KEY (id_ot) REFERENCES public.op_orden_trabajo(id_ot);


--
-- TOC entry 6227 (class 2606 OID 19735)
-- Name: op_ot_evidencia op_ot_evidencia_id_ot_formulario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_evidencia
    ADD CONSTRAINT op_ot_evidencia_id_ot_formulario_fkey FOREIGN KEY (id_ot_formulario) REFERENCES public.op_ot_formulario(id_ot_formulario);


--
-- TOC entry 6228 (class 2606 OID 19740)
-- Name: op_ot_evidencia op_ot_evidencia_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_evidencia
    ADD CONSTRAINT op_ot_evidencia_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.seg_usuario(id_usuario);


--
-- TOC entry 6220 (class 2606 OID 19642)
-- Name: op_ot_formulario op_ot_formulario_id_formulario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_formulario
    ADD CONSTRAINT op_ot_formulario_id_formulario_fkey FOREIGN KEY (id_formulario) REFERENCES public.cat_formulario(id_formulario);


--
-- TOC entry 6221 (class 2606 OID 19637)
-- Name: op_ot_formulario op_ot_formulario_id_ot_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_formulario
    ADD CONSTRAINT op_ot_formulario_id_ot_fkey FOREIGN KEY (id_ot) REFERENCES public.op_orden_trabajo(id_ot);


--
-- TOC entry 6222 (class 2606 OID 19647)
-- Name: op_ot_formulario op_ot_formulario_id_usuario_registro_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_formulario
    ADD CONSTRAINT op_ot_formulario_id_usuario_registro_fkey FOREIGN KEY (id_usuario_registro) REFERENCES public.seg_usuario(id_usuario);


--
-- TOC entry 6223 (class 2606 OID 19674)
-- Name: op_ot_formulario_respuesta op_ot_formulario_respuesta_id_formulario_campo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_formulario_respuesta
    ADD CONSTRAINT op_ot_formulario_respuesta_id_formulario_campo_fkey FOREIGN KEY (id_formulario_campo) REFERENCES public.cat_formulario_campo(id_formulario_campo);


--
-- TOC entry 6224 (class 2606 OID 19669)
-- Name: op_ot_formulario_respuesta op_ot_formulario_respuesta_id_ot_formulario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_formulario_respuesta
    ADD CONSTRAINT op_ot_formulario_respuesta_id_ot_formulario_fkey FOREIGN KEY (id_ot_formulario) REFERENCES public.op_ot_formulario(id_ot_formulario);


--
-- TOC entry 6225 (class 2606 OID 19704)
-- Name: op_ot_validacion_foto op_ot_validacion_foto_id_ot_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.op_ot_validacion_foto
    ADD CONSTRAINT op_ot_validacion_foto_id_ot_fkey FOREIGN KEY (id_ot) REFERENCES public.op_orden_trabajo(id_ot);


--
-- TOC entry 6183 (class 2606 OID 19036)
-- Name: rrhh_capataz rrhh_capataz_id_trabajador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rrhh_capataz
    ADD CONSTRAINT rrhh_capataz_id_trabajador_fkey FOREIGN KEY (id_trabajador) REFERENCES public.rrhh_trabajador(id_trabajador);


--
-- TOC entry 6184 (class 2606 OID 19031)
-- Name: rrhh_capataz rrhh_capataz_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rrhh_capataz
    ADD CONSTRAINT rrhh_capataz_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.seg_usuario(id_usuario);


--
-- TOC entry 6182 (class 2606 OID 18983)
-- Name: seg_usuario seg_usuario_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seg_usuario
    ADD CONSTRAINT seg_usuario_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.seg_rol(id_rol);


--
-- TOC entry 6229 (class 2606 OID 19774)
-- Name: sync_operacion_movil sync_operacion_movil_id_ot_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_operacion_movil
    ADD CONSTRAINT sync_operacion_movil_id_ot_fkey FOREIGN KEY (id_ot) REFERENCES public.op_orden_trabajo(id_ot);


--
-- TOC entry 6230 (class 2606 OID 19769)
-- Name: sync_operacion_movil sync_operacion_movil_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_operacion_movil
    ADD CONSTRAINT sync_operacion_movil_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.seg_usuario(id_usuario);


-- Completed on 2026-05-13 17:18:02

--
-- PostgreSQL database dump complete
--

\unrestrict cdo1KDMkMzyvllLXsNuHlh6fs8b9YYd8mjx8oyFFaN5eaEcDdiwBEb4TuYChpIp

