PGDMP                      }            qlnckh    17.4    17.4 �    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16690    qlnckh    DATABASE     l   CREATE DATABASE qlnckh WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en-US';
    DROP DATABASE qlnckh;
                     postgres    false            �            1259    16691 
   admin_logs    TABLE     �  CREATE TABLE public.admin_logs (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    hanh_dong character varying(255) NOT NULL,
    doi_tuong character varying(100) NOT NULL,
    doi_tuong_id character varying(50) NOT NULL,
    noi_dung_truoc text,
    noi_dung_sau text,
    thoi_gian timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(50)
);
    DROP TABLE public.admin_logs;
       public         heap r       postgres    false            �            1259    16697    admin_logs_id_seq    SEQUENCE     �   CREATE SEQUENCE public.admin_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.admin_logs_id_seq;
       public               postgres    false    217            �           0    0    admin_logs_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.admin_logs_id_seq OWNED BY public.admin_logs.id;
          public               postgres    false    218            �            1259    16698    bai_bao    TABLE     x  CREATE TABLE public.bai_bao (
    de_tai_id character varying(50),
    ten_bai_bao character varying(255) NOT NULL,
    ngay_xuat_ban date,
    mo_ta text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id integer NOT NULL,
    nhan_xet text,
    trang_thai character varying(20) DEFAULT 'chờ duyệt'::character varying,
    msvc_nguoi_nop character varying(50),
    admin_msvc character varying(50),
    CONSTRAINT bai_bao_trang_thai_check CHECK (((trang_thai)::text = ANY ((ARRAY['chờ duyệt'::character varying, 'đã duyệt'::character varying, 'từ chối'::character varying])::text[])))
);
    DROP TABLE public.bai_bao;
       public         heap r       postgres    false            �           0    0    COLUMN bai_bao.trang_thai    COMMENT     z   COMMENT ON COLUMN public.bai_bao.trang_thai IS 'Trạng thái của bài báo: chờ duyệt, đã duyệt, từ chối';
          public               postgres    false    219            �            1259    25041    bai_bao_id_seq    SEQUENCE     �   ALTER TABLE public.bai_bao ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.bai_bao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public               postgres    false    219            �            1259    16705    cap_nhiem_vu    TABLE     �   CREATE TABLE public.cap_nhiem_vu (
    id integer NOT NULL,
    ten character varying(100) NOT NULL,
    kinh_phi numeric(18,2) NOT NULL,
    parent_id integer
);
     DROP TABLE public.cap_nhiem_vu;
       public         heap r       postgres    false            �            1259    16708    cap_nhiem_vu_id_seq    SEQUENCE     �   CREATE SEQUENCE public.cap_nhiem_vu_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.cap_nhiem_vu_id_seq;
       public               postgres    false    220            �           0    0    cap_nhiem_vu_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.cap_nhiem_vu_id_seq OWNED BY public.cap_nhiem_vu.id;
          public               postgres    false    221            �            1259    16713    de_tai    TABLE     �  CREATE TABLE public.de_tai (
    ten_de_tai character varying(255) NOT NULL,
    trang_thai_id integer,
    ghi_chu text,
    admin_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    lvnc_id integer,
    cnv_id integer,
    chu_tri_id integer,
    chu_quan_id integer,
    thoi_gian_nop timestamp without time zone,
    loai_hinh_nghien_cuu character varying(50),
    thoi_gian_thuc_hien integer,
    tong_kinh_phi numeric(15,2),
    tong_quan_van_de text,
    tinh_cap_thiet text,
    muc_tieu_nghien_cuu text,
    noi_dung_phuong_phap text,
    thoi_gian_xet_duyet timestamp without time zone,
    doi_tuong text,
    pham_vi text,
    ma_de_tai character varying(50),
    id integer NOT NULL,
    msvc_gvdk character varying(50),
    ngay_bat_dau_dukien timestamp without time zone,
    ngay_ket_thuc_dukien timestamp without time zone,
    nhan_xet text
);
    DROP TABLE public.de_tai;
       public         heap r       postgres    false            �           0    0    COLUMN de_tai.thoi_gian_nop    COMMENT     i   COMMENT ON COLUMN public.de_tai.thoi_gian_nop IS 'thoi gian sẽ phải nộp đề tài nghiên cứu';
          public               postgres    false    222            �           0    0    COLUMN de_tai.msvc_gvdk    COMMENT     T   COMMENT ON COLUMN public.de_tai.msvc_gvdk IS 'msvc của giảng viên đăng ký';
          public               postgres    false    222            �            1259    16857    de_tai_id_seq    SEQUENCE     �   CREATE SEQUENCE public.de_tai_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.de_tai_id_seq;
       public               postgres    false    222            �           0    0    de_tai_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.de_tai_id_seq OWNED BY public.de_tai.id;
          public               postgres    false    248            �            1259    16719    de_tai_tien_do    TABLE     �   CREATE TABLE public.de_tai_tien_do (
    id integer NOT NULL,
    de_tai_id character varying(50),
    tien_do_id integer,
    mo_ta text,
    is_present boolean,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 "   DROP TABLE public.de_tai_tien_do;
       public         heap r       postgres    false            �           0    0     COLUMN de_tai_tien_do.is_present    COMMENT     S   COMMENT ON COLUMN public.de_tai_tien_do.is_present IS 'tiến độ hiện tại';
          public               postgres    false    223            �           0    0     COLUMN de_tai_tien_do.created_at    COMMENT     j   COMMENT ON COLUMN public.de_tai_tien_do.created_at IS 'thời gian cập nhật tiến độ đề tài';
          public               postgres    false    223            �            1259    16725    de_tai_tien_do_id_seq    SEQUENCE     �   CREATE SEQUENCE public.de_tai_tien_do_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 ,   DROP SEQUENCE public.de_tai_tien_do_id_seq;
       public               postgres    false    223            �           0    0    de_tai_tien_do_id_seq    SEQUENCE OWNED BY     O   ALTER SEQUENCE public.de_tai_tien_do_id_seq OWNED BY public.de_tai_tien_do.id;
          public               postgres    false    224            �            1259    16726    don_vi    TABLE     x   CREATE TABLE public.don_vi (
    id integer NOT NULL,
    ten character varying(100) NOT NULL,
    parent_id integer
);
    DROP TABLE public.don_vi;
       public         heap r       postgres    false            �            1259    16729    don_vi_id_seq    SEQUENCE     �   CREATE SEQUENCE public.don_vi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.don_vi_id_seq;
       public               postgres    false    225            �           0    0    don_vi_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.don_vi_id_seq OWNED BY public.don_vi.id;
          public               postgres    false    226            �            1259    16730    hoc_ham    TABLE     b   CREATE TABLE public.hoc_ham (
    id integer NOT NULL,
    ten character varying(100) NOT NULL
);
    DROP TABLE public.hoc_ham;
       public         heap r       postgres    false            �            1259    16733    hoc_ham_id_seq    SEQUENCE     �   CREATE SEQUENCE public.hoc_ham_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.hoc_ham_id_seq;
       public               postgres    false    227            �           0    0    hoc_ham_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.hoc_ham_id_seq OWNED BY public.hoc_ham.id;
          public               postgres    false    228            �            1259    16734    hoc_vi    TABLE     a   CREATE TABLE public.hoc_vi (
    id integer NOT NULL,
    ten character varying(100) NOT NULL
);
    DROP TABLE public.hoc_vi;
       public         heap r       postgres    false            �            1259    16737    hoc_vi_id_seq    SEQUENCE     �   CREATE SEQUENCE public.hoc_vi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 $   DROP SEQUENCE public.hoc_vi_id_seq;
       public               postgres    false    229            �           0    0    hoc_vi_id_seq    SEQUENCE OWNED BY     ?   ALTER SEQUENCE public.hoc_vi_id_seq OWNED BY public.hoc_vi.id;
          public               postgres    false    230            �            1259    16738    linh_vuc_nc    TABLE     f   CREATE TABLE public.linh_vuc_nc (
    id integer NOT NULL,
    ten character varying(100) NOT NULL
);
    DROP TABLE public.linh_vuc_nc;
       public         heap r       postgres    false            �            1259    16741    linh_vuc_nc_id_seq    SEQUENCE     �   CREATE SEQUENCE public.linh_vuc_nc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.linh_vuc_nc_id_seq;
       public               postgres    false    231            �           0    0    linh_vuc_nc_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.linh_vuc_nc_id_seq OWNED BY public.linh_vuc_nc.id;
          public               postgres    false    232            �            1259    16889    notifications    TABLE     `  CREATE TABLE public.notifications (
    id uuid NOT NULL,
    type character varying(255) NOT NULL,
    notifiable_type character varying(255) NOT NULL,
    notifiable_id bigint NOT NULL,
    data text NOT NULL,
    read_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);
 !   DROP TABLE public.notifications;
       public         heap r       postgres    false            �            1259    16742    permissions    TABLE     �   CREATE TABLE public.permissions (
    id integer NOT NULL,
    ma_quyen character varying(50) NOT NULL,
    mo_ta character varying(255)
);
    DROP TABLE public.permissions;
       public         heap r       postgres    false            �            1259    16745    permissions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 )   DROP SEQUENCE public.permissions_id_seq;
       public               postgres    false    233            �           0    0    permissions_id_seq    SEQUENCE OWNED BY     I   ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;
          public               postgres    false    234            �            1259    16878    personal_access_tokens    TABLE     �  CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);
 *   DROP TABLE public.personal_access_tokens;
       public         heap r       postgres    false            �            1259    16877    personal_access_tokens_id_seq    SEQUENCE     �   CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.personal_access_tokens_id_seq;
       public               postgres    false    250            �           0    0    personal_access_tokens_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;
          public               postgres    false    249            �            1259    16746    tai_lieu    TABLE       CREATE TABLE public.tai_lieu (
    id integer NOT NULL,
    file_path character varying(255) NOT NULL,
    mo_ta text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    bai_bao_id integer,
    msvc_nguoi_upload character varying(50)
);
    DROP TABLE public.tai_lieu;
       public         heap r       postgres    false            �            1259    16752    tai_lieu_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tai_lieu_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.tai_lieu_id_seq;
       public               postgres    false    235            �           0    0    tai_lieu_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.tai_lieu_id_seq OWNED BY public.tai_lieu.id;
          public               postgres    false    236            �            1259    16753    tham_gia    TABLE     �   CREATE TABLE public.tham_gia (
    de_tai_id integer,
    join_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    vai_tro_id integer NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    msvc character varying(50)
);
    DROP TABLE public.tham_gia;
       public         heap r       postgres    false            �           0    0    COLUMN tham_gia.msvc    COMMENT     M   COMMENT ON COLUMN public.tham_gia.msvc IS 'giáo viên tham gia đề tài';
          public               postgres    false    237            �            1259    16757    tien_do    TABLE     �   CREATE TABLE public.tien_do (
    id integer NOT NULL,
    ten_moc character varying(100) NOT NULL,
    mo_ta text,
    thu_tu integer NOT NULL
);
    DROP TABLE public.tien_do;
       public         heap r       postgres    false            �            1259    16762    tien_do_id_seq    SEQUENCE     �   CREATE SEQUENCE public.tien_do_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.tien_do_id_seq;
       public               postgres    false    238            �           0    0    tien_do_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.tien_do_id_seq OWNED BY public.tien_do.id;
          public               postgres    false    239            �            1259    16763    trang_thai_de_tai    TABLE     �   CREATE TABLE public.trang_thai_de_tai (
    id integer NOT NULL,
    ma_trang_thai character varying(50) NOT NULL,
    ten_hien_thi character varying(100) NOT NULL,
    mo_ta text
);
 %   DROP TABLE public.trang_thai_de_tai;
       public         heap r       postgres    false            �            1259    16768    trang_thai_de_tai_id_seq    SEQUENCE     �   CREATE SEQUENCE public.trang_thai_de_tai_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.trang_thai_de_tai_id_seq;
       public               postgres    false    240            �           0    0    trang_thai_de_tai_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.trang_thai_de_tai_id_seq OWNED BY public.trang_thai_de_tai.id;
          public               postgres    false    241            �            1259    16769    user_permissions    TABLE     �   CREATE TABLE public.user_permissions (
    id integer NOT NULL,
    msvc character varying(50) NOT NULL,
    permission_id integer NOT NULL,
    assigned_by integer,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
 $   DROP TABLE public.user_permissions;
       public         heap r       postgres    false            �            1259    16773    user_permissions_id_seq    SEQUENCE     �   CREATE SEQUENCE public.user_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.user_permissions_id_seq;
       public               postgres    false    242            �           0    0    user_permissions_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.user_permissions_id_seq OWNED BY public.user_permissions.id;
          public               postgres    false    243            �            1259    16774    users    TABLE     W  CREATE TABLE public.users (
    id integer NOT NULL,
    ho_ten character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    sdt character varying(15),
    mssv character varying(50),
    msvc character varying(50),
    is_superadmin boolean DEFAULT false,
    don_vi_id integer,
    hoc_ham_id integer,
    hoc_vi_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    dob date,
    CONSTRAINT users_check CHECK ((((mssv IS NOT NULL) AND (msvc IS NULL)) OR ((msvc IS NOT NULL) AND (mssv IS NULL))))
);
    DROP TABLE public.users;
       public         heap r       postgres    false            �            1259    16782    users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.users_id_seq;
       public               postgres    false    244                        0    0    users_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
          public               postgres    false    245            �            1259    16843    vai_tro    TABLE     y   CREATE TABLE public.vai_tro (
    id integer NOT NULL,
    ten_vai_tro character varying(50) NOT NULL,
    mo_ta text
);
    DROP TABLE public.vai_tro;
       public         heap r       postgres    false            �            1259    16842    vai_tro_id_seq    SEQUENCE     �   CREATE SEQUENCE public.vai_tro_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.vai_tro_id_seq;
       public               postgres    false    247                       0    0    vai_tro_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.vai_tro_id_seq OWNED BY public.vai_tro.id;
          public               postgres    false    246            �           2604    16783    admin_logs id    DEFAULT     n   ALTER TABLE ONLY public.admin_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_logs_id_seq'::regclass);
 <   ALTER TABLE public.admin_logs ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    218    217            �           2604    16784    cap_nhiem_vu id    DEFAULT     r   ALTER TABLE ONLY public.cap_nhiem_vu ALTER COLUMN id SET DEFAULT nextval('public.cap_nhiem_vu_id_seq'::regclass);
 >   ALTER TABLE public.cap_nhiem_vu ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    221    220            �           2604    16858 	   de_tai id    DEFAULT     f   ALTER TABLE ONLY public.de_tai ALTER COLUMN id SET DEFAULT nextval('public.de_tai_id_seq'::regclass);
 8   ALTER TABLE public.de_tai ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    248    222            �           2604    16785    de_tai_tien_do id    DEFAULT     v   ALTER TABLE ONLY public.de_tai_tien_do ALTER COLUMN id SET DEFAULT nextval('public.de_tai_tien_do_id_seq'::regclass);
 @   ALTER TABLE public.de_tai_tien_do ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    224    223            �           2604    16786 	   don_vi id    DEFAULT     f   ALTER TABLE ONLY public.don_vi ALTER COLUMN id SET DEFAULT nextval('public.don_vi_id_seq'::regclass);
 8   ALTER TABLE public.don_vi ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    226    225            �           2604    16787 
   hoc_ham id    DEFAULT     h   ALTER TABLE ONLY public.hoc_ham ALTER COLUMN id SET DEFAULT nextval('public.hoc_ham_id_seq'::regclass);
 9   ALTER TABLE public.hoc_ham ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    228    227            �           2604    16788 	   hoc_vi id    DEFAULT     f   ALTER TABLE ONLY public.hoc_vi ALTER COLUMN id SET DEFAULT nextval('public.hoc_vi_id_seq'::regclass);
 8   ALTER TABLE public.hoc_vi ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    230    229            �           2604    16789    linh_vuc_nc id    DEFAULT     p   ALTER TABLE ONLY public.linh_vuc_nc ALTER COLUMN id SET DEFAULT nextval('public.linh_vuc_nc_id_seq'::regclass);
 =   ALTER TABLE public.linh_vuc_nc ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    232    231            �           2604    16790    permissions id    DEFAULT     p   ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);
 =   ALTER TABLE public.permissions ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    234    233            �           2604    16881    personal_access_tokens id    DEFAULT     �   ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);
 H   ALTER TABLE public.personal_access_tokens ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    249    250    250            �           2604    16791    tai_lieu id    DEFAULT     j   ALTER TABLE ONLY public.tai_lieu ALTER COLUMN id SET DEFAULT nextval('public.tai_lieu_id_seq'::regclass);
 :   ALTER TABLE public.tai_lieu ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    236    235            �           2604    16792 
   tien_do id    DEFAULT     h   ALTER TABLE ONLY public.tien_do ALTER COLUMN id SET DEFAULT nextval('public.tien_do_id_seq'::regclass);
 9   ALTER TABLE public.tien_do ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    239    238            �           2604    16793    trang_thai_de_tai id    DEFAULT     |   ALTER TABLE ONLY public.trang_thai_de_tai ALTER COLUMN id SET DEFAULT nextval('public.trang_thai_de_tai_id_seq'::regclass);
 C   ALTER TABLE public.trang_thai_de_tai ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    241    240            �           2604    16794    user_permissions id    DEFAULT     z   ALTER TABLE ONLY public.user_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_permissions_id_seq'::regclass);
 B   ALTER TABLE public.user_permissions ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    243    242            �           2604    16795    users id    DEFAULT     d   ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
 7   ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    245    244            �           2604    16846 
   vai_tro id    DEFAULT     h   ALTER TABLE ONLY public.vai_tro ALTER COLUMN id SET DEFAULT nextval('public.vai_tro_id_seq'::regclass);
 9   ALTER TABLE public.vai_tro ALTER COLUMN id DROP DEFAULT;
       public               postgres    false    247    246    247            �          0    16691 
   admin_logs 
   TABLE DATA           �   COPY public.admin_logs (id, admin_id, hanh_dong, doi_tuong, doi_tuong_id, noi_dung_truoc, noi_dung_sau, thoi_gian, ip_address) FROM stdin;
    public               postgres    false    217   �       �          0    16698    bai_bao 
   TABLE DATA           �   COPY public.bai_bao (de_tai_id, ten_bai_bao, ngay_xuat_ban, mo_ta, created_at, id, nhan_xet, trang_thai, msvc_nguoi_nop, admin_msvc) FROM stdin;
    public               postgres    false    219    �       �          0    16705    cap_nhiem_vu 
   TABLE DATA           D   COPY public.cap_nhiem_vu (id, ten, kinh_phi, parent_id) FROM stdin;
    public               postgres    false    220   2�       �          0    16713    de_tai 
   TABLE DATA           �  COPY public.de_tai (ten_de_tai, trang_thai_id, ghi_chu, admin_id, created_at, lvnc_id, cnv_id, chu_tri_id, chu_quan_id, thoi_gian_nop, loai_hinh_nghien_cuu, thoi_gian_thuc_hien, tong_kinh_phi, tong_quan_van_de, tinh_cap_thiet, muc_tieu_nghien_cuu, noi_dung_phuong_phap, thoi_gian_xet_duyet, doi_tuong, pham_vi, ma_de_tai, id, msvc_gvdk, ngay_bat_dau_dukien, ngay_ket_thuc_dukien, nhan_xet) FROM stdin;
    public               postgres    false    222   9�       �          0    16719    de_tai_tien_do 
   TABLE DATA           b   COPY public.de_tai_tien_do (id, de_tai_id, tien_do_id, mo_ta, is_present, created_at) FROM stdin;
    public               postgres    false    223   |�       �          0    16726    don_vi 
   TABLE DATA           4   COPY public.don_vi (id, ten, parent_id) FROM stdin;
    public               postgres    false    225   F�       �          0    16730    hoc_ham 
   TABLE DATA           *   COPY public.hoc_ham (id, ten) FROM stdin;
    public               postgres    false    227   ��       �          0    16734    hoc_vi 
   TABLE DATA           )   COPY public.hoc_vi (id, ten) FROM stdin;
    public               postgres    false    229   ز       �          0    16738    linh_vuc_nc 
   TABLE DATA           .   COPY public.linh_vuc_nc (id, ten) FROM stdin;
    public               postgres    false    231   �       �          0    16889    notifications 
   TABLE DATA           x   COPY public.notifications (id, type, notifiable_type, notifiable_id, data, read_at, created_at, updated_at) FROM stdin;
    public               postgres    false    251   ��       �          0    16742    permissions 
   TABLE DATA           :   COPY public.permissions (id, ma_quyen, mo_ta) FROM stdin;
    public               postgres    false    233   ��       �          0    16878    personal_access_tokens 
   TABLE DATA           �   COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
    public               postgres    false    250   �       �          0    16746    tai_lieu 
   TABLE DATA           c   COPY public.tai_lieu (id, file_path, mo_ta, created_at, bai_bao_id, msvc_nguoi_upload) FROM stdin;
    public               postgres    false    235   �       �          0    16753    tham_gia 
   TABLE DATA           R   COPY public.tham_gia (de_tai_id, join_at, vai_tro_id, can_edit, msvc) FROM stdin;
    public               postgres    false    237   |�       �          0    16757    tien_do 
   TABLE DATA           =   COPY public.tien_do (id, ten_moc, mo_ta, thu_tu) FROM stdin;
    public               postgres    false    238   H�       �          0    16763    trang_thai_de_tai 
   TABLE DATA           S   COPY public.trang_thai_de_tai (id, ma_trang_thai, ten_hien_thi, mo_ta) FROM stdin;
    public               postgres    false    240   �       �          0    16769    user_permissions 
   TABLE DATA           ]   COPY public.user_permissions (id, msvc, permission_id, assigned_by, assigned_at) FROM stdin;
    public               postgres    false    242   Ȼ       �          0    16774    users 
   TABLE DATA           �   COPY public.users (id, ho_ten, email, password, sdt, mssv, msvc, is_superadmin, don_vi_id, hoc_ham_id, hoc_vi_id, created_at, dob) FROM stdin;
    public               postgres    false    244   ?�       �          0    16843    vai_tro 
   TABLE DATA           9   COPY public.vai_tro (id, ten_vai_tro, mo_ta) FROM stdin;
    public               postgres    false    247   c�                  0    0    admin_logs_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.admin_logs_id_seq', 1, false);
          public               postgres    false    218                       0    0    bai_bao_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.bai_bao_id_seq', 19, true);
          public               postgres    false    252                       0    0    cap_nhiem_vu_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.cap_nhiem_vu_id_seq', 12, true);
          public               postgres    false    221                       0    0    de_tai_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.de_tai_id_seq', 32, true);
          public               postgres    false    248                       0    0    de_tai_tien_do_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.de_tai_tien_do_id_seq', 15, true);
          public               postgres    false    224                       0    0    don_vi_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.don_vi_id_seq', 21, true);
          public               postgres    false    226                       0    0    hoc_ham_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.hoc_ham_id_seq', 1, false);
          public               postgres    false    228            	           0    0    hoc_vi_id_seq    SEQUENCE SET     <   SELECT pg_catalog.setval('public.hoc_vi_id_seq', 1, false);
          public               postgres    false    230            
           0    0    linh_vuc_nc_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.linh_vuc_nc_id_seq', 7, true);
          public               postgres    false    232                       0    0    permissions_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.permissions_id_seq', 1, true);
          public               postgres    false    234                       0    0    personal_access_tokens_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 1, false);
          public               postgres    false    249                       0    0    tai_lieu_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.tai_lieu_id_seq', 16, true);
          public               postgres    false    236                       0    0    tien_do_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.tien_do_id_seq', 1, false);
          public               postgres    false    239                       0    0    trang_thai_de_tai_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.trang_thai_de_tai_id_seq', 1, false);
          public               postgres    false    241                       0    0    user_permissions_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.user_permissions_id_seq', 4, true);
          public               postgres    false    243                       0    0    users_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.users_id_seq', 54, true);
          public               postgres    false    245                       0    0    vai_tro_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.vai_tro_id_seq', 1, false);
          public               postgres    false    246            �           2606    16797    admin_logs admin_logs_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);
 D   ALTER TABLE ONLY public.admin_logs DROP CONSTRAINT admin_logs_pkey;
       public                 postgres    false    217            �           2606    25038    bai_bao bai_bao_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.bai_bao
    ADD CONSTRAINT bai_bao_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.bai_bao DROP CONSTRAINT bai_bao_pkey;
       public                 postgres    false    219                        2606    16801    cap_nhiem_vu cap_nhiem_vu_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.cap_nhiem_vu
    ADD CONSTRAINT cap_nhiem_vu_pkey PRIMARY KEY (id);
 H   ALTER TABLE ONLY public.cap_nhiem_vu DROP CONSTRAINT cap_nhiem_vu_pkey;
       public                 postgres    false    220                       2606    16860    de_tai de_tai_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.de_tai
    ADD CONSTRAINT de_tai_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.de_tai DROP CONSTRAINT de_tai_pkey;
       public                 postgres    false    222                       2606    16807 "   de_tai_tien_do de_tai_tien_do_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.de_tai_tien_do
    ADD CONSTRAINT de_tai_tien_do_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.de_tai_tien_do DROP CONSTRAINT de_tai_tien_do_pkey;
       public                 postgres    false    223                       2606    16809    don_vi don_vi_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.don_vi
    ADD CONSTRAINT don_vi_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.don_vi DROP CONSTRAINT don_vi_pkey;
       public                 postgres    false    225            
           2606    16811    hoc_ham hoc_ham_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.hoc_ham
    ADD CONSTRAINT hoc_ham_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.hoc_ham DROP CONSTRAINT hoc_ham_pkey;
       public                 postgres    false    227                       2606    16813    hoc_vi hoc_vi_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.hoc_vi
    ADD CONSTRAINT hoc_vi_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.hoc_vi DROP CONSTRAINT hoc_vi_pkey;
       public                 postgres    false    229                       2606    16815    linh_vuc_nc linh_vuc_nc_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.linh_vuc_nc
    ADD CONSTRAINT linh_vuc_nc_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.linh_vuc_nc DROP CONSTRAINT linh_vuc_nc_pkey;
       public                 postgres    false    231            0           2606    16896     notifications notifications_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_pkey;
       public                 postgres    false    251                       2606    16817 $   permissions permissions_ma_quyen_key 
   CONSTRAINT     c   ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_ma_quyen_key UNIQUE (ma_quyen);
 N   ALTER TABLE ONLY public.permissions DROP CONSTRAINT permissions_ma_quyen_key;
       public                 postgres    false    233                       2606    16819    permissions permissions_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.permissions DROP CONSTRAINT permissions_pkey;
       public                 postgres    false    233            *           2606    16885 2   personal_access_tokens personal_access_tokens_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.personal_access_tokens DROP CONSTRAINT personal_access_tokens_pkey;
       public                 postgres    false    250            ,           2606    16888 :   personal_access_tokens personal_access_tokens_token_unique 
   CONSTRAINT     v   ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);
 d   ALTER TABLE ONLY public.personal_access_tokens DROP CONSTRAINT personal_access_tokens_token_unique;
       public                 postgres    false    250                       2606    16821    tai_lieu tai_lieu_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.tai_lieu
    ADD CONSTRAINT tai_lieu_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.tai_lieu DROP CONSTRAINT tai_lieu_pkey;
       public                 postgres    false    235                       2606    16825    tien_do tien_do_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.tien_do
    ADD CONSTRAINT tien_do_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.tien_do DROP CONSTRAINT tien_do_pkey;
       public                 postgres    false    238                       2606    16827 5   trang_thai_de_tai trang_thai_de_tai_ma_trang_thai_key 
   CONSTRAINT     y   ALTER TABLE ONLY public.trang_thai_de_tai
    ADD CONSTRAINT trang_thai_de_tai_ma_trang_thai_key UNIQUE (ma_trang_thai);
 _   ALTER TABLE ONLY public.trang_thai_de_tai DROP CONSTRAINT trang_thai_de_tai_ma_trang_thai_key;
       public                 postgres    false    240                       2606    16829 (   trang_thai_de_tai trang_thai_de_tai_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.trang_thai_de_tai
    ADD CONSTRAINT trang_thai_de_tai_pkey PRIMARY KEY (id);
 R   ALTER TABLE ONLY public.trang_thai_de_tai DROP CONSTRAINT trang_thai_de_tai_pkey;
       public                 postgres    false    240                       2606    16898    de_tai uc_ma_de_tai 
   CONSTRAINT     S   ALTER TABLE ONLY public.de_tai
    ADD CONSTRAINT uc_ma_de_tai UNIQUE (ma_de_tai);
 =   ALTER TABLE ONLY public.de_tai DROP CONSTRAINT uc_ma_de_tai;
       public                 postgres    false    222                       2606    16831 &   user_permissions user_permissions_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);
 P   ALTER TABLE ONLY public.user_permissions DROP CONSTRAINT user_permissions_pkey;
       public                 postgres    false    242                       2606    16833    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    244                        2606    16835    users users_mssv_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_mssv_key UNIQUE (mssv);
 >   ALTER TABLE ONLY public.users DROP CONSTRAINT users_mssv_key;
       public                 postgres    false    244            "           2606    16837    users users_msvc_key 
   CONSTRAINT     O   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_msvc_key UNIQUE (msvc);
 >   ALTER TABLE ONLY public.users DROP CONSTRAINT users_msvc_key;
       public                 postgres    false    244            $           2606    16839    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    244            &           2606    16850    vai_tro vai_tro_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.vai_tro
    ADD CONSTRAINT vai_tro_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.vai_tro DROP CONSTRAINT vai_tro_pkey;
       public                 postgres    false    247            (           2606    16852    vai_tro vai_tro_ten_vai_tro_key 
   CONSTRAINT     a   ALTER TABLE ONLY public.vai_tro
    ADD CONSTRAINT vai_tro_ten_vai_tro_key UNIQUE (ten_vai_tro);
 I   ALTER TABLE ONLY public.vai_tro DROP CONSTRAINT vai_tro_ten_vai_tro_key;
       public                 postgres    false    247            .           1259    16894 1   notifications_notifiable_type_notifiable_id_index    INDEX     �   CREATE INDEX notifications_notifiable_type_notifiable_id_index ON public.notifications USING btree (notifiable_type, notifiable_id);
 E   DROP INDEX public.notifications_notifiable_type_notifiable_id_index;
       public                 postgres    false    251    251            -           1259    16886 8   personal_access_tokens_tokenable_type_tokenable_id_index    INDEX     �   CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);
 L   DROP INDEX public.personal_access_tokens_tokenable_type_tokenable_id_index;
       public                 postgres    false    250    250            �      x������ � �      �   "  x���;n�@ �z8�����C�n�w����b#�����i�S:�=�IfcK�W'а#1��\�$��9rJ(#���
lm��^#�b��ac�`� _��{j_^�v@!�F�����)Aׄ
�?�w�@���b2�����R�d�:6LcX^>!t�G�{����MNL*T߉�A��hVB��3cc�:�c�����h�
N���7���4����BJ�,V2��������b1�ƔbUB���?���g%+Ye�L��x��c_��#�Yr�J/=��ٮ�$�h2 i      �   �   x�e����@E���x_@Z
k����
�iJ�ѡ�G!0 �f�4
��O��?ޟ� iä{�}���s~H1��uyf������p�i�/�-4_Dϊ~����u��5�g�NatC��C��z����Ĥ�����R1-�30V��u�sU�4&f�z����jt��{8UZ�y��g=Y2�Sc�"�Cc��MN����u�'�����$�o�y��aZ����\ff{�fo�o��q��f�aC�^E�      �   3  x��TMo�@=o~���w���o��Z���^Ll�V����GāBjΨ������NĪ88���?��:M�8���cg����7{Q�,�u�=ƙ0E��Y~�%q�Vƙ�+�Ϗ���i����p�^f�Ðq�\�a���y���x�w�fK��m3�1Qc��-�K����'�9�m���5�,�6ŠL��� #i�b?=��G�J�^z1��}יZOE%4ﶞѥ��}��F���|�F�"2r`N�28
[��\]���G�|����Ul��[�"7K���a��U�H?U9._�<\j֦��'��텆/n��+�Hv�� �	���4����0 �m��oG�>6)�B$^ݝ��7^�� ��u��4�]���K@K�;<�u � 1��R+p��Y?$>QQ�L&�%��0D�*W+Z(�x;��ņ����PP�B��@q��Y;����0#�?Y�mV�����)����F�n@�^��̮�Be�T�Y%-{[��]�KewF���V#a�O%5�aQ�k �,rs!o7���C�3��e�Q�[sD��q7��l�ei��#2k�LX�'r�hVr�Q��|��f�|��棇���6>B?럄��T}r
C�1����aϕ?�:Β�+eof�'���;l�����=r�*�F=�k�<Y���(��u!p��Y[�ӃdO�>�����e�g�EM�:��lmxq��7��dC+wtK��7���ͮ3�[j�^����]r�?��X5�Vtm�C����D�w/*�jx������EZR�E�
E�����E��8��z}�ϊ�υ-+���@`�R�0��<�D׍R���ZP�      �   �  x�}��j�0���S�T����ֵ����-����M킕@����
=��RJ
�zZSz��7�Ȧ�ݺ��X�������śWo��*/O�c!�f�m>�����vi���kW��O�Y�p������Bg��J�|��8,C(.�}s��N��5�>��Aׂ�g��/dPh��HZ�B��0NL8`��޵��!�ʯ��������v�_�,�K�~����b�y ��7_�T0��h�A�a@��h�.,��r	W�/K=�����@�������n���
���6閤���"�P̝��o+�f����<n�C�tĳ�P��9QO/E����3��heT*�D�Q�Q�&EO0���0��FFqO��CӫS#3���"�z||($��g"Kj(d�Q�2L�9�=S�W#��Ph�Q�vY��I])G������������      �   L  x�e��N�0�g�)����wf(RQ��ԥ)�DT��@��{b )S�����7�:nhK$������h
��7���f@#�I�{�J�
�ri厓�Bg\�Ā
��	p��:��A����fߊjϩAa� i��>1�q�1*G8p�\#��,d~��sS�q�|ǎ�������^DH��-GƦ���MN�~�!P������hb\�[[���k�F��,��[�#���Xg�]�bW��j�Yb�G	�/�,���O�<�pqT�]����ws��k������vmd�)+�庉���ڈj �u*`���$�&���� �H��      �   &   x�3��x��7Y!���\C.#d��12ט+F��� ��      �   &   x�3��x��7Y����nC.#d��12ט+F��� �!      �   y   x�3����OT�x��7Y����
y��W�q!Kd?ܽS�$��᮵%
e�($ޒ�����n�2FVZ���rl��݋��L���`:2�Z
�L��*/�ff����8�(O��HsW� &�G/      �      x������ � �      �   !  x�u��N�0���)�*$(� �-,HYBSէ�P��BjŔH�` b����pv�*XΧ���Ż�in�7'�C�#�2s����V�5�p�0�h�$j��n�+���^;,��-���I�s&z0�Q�5�a$�yTf�,#F����'��G��ɚg_�z�"-�k}bF�^NAI>4��l�g7�V��s�cW�,QpRHU0he&�5}yW�����n5*� ���A���97Tj�7��Rk^PnVu?i�)��ig�NF��G�H��M���!�P�v      �      x������ � �      �   j  x���Kr�F �5>�/0�tC� ��@�v�j
�XH n�Cd�ݬ�Mj�17��H*\�>�W?��Cn姟W���_U~�l�]u�o��k���E`o��h�9�=t��l�3+�ִ��資���*:T��C �O�|���2 2!�0DP��Aw�̌���u���Z�8[DÚ��j��!��<��&��C����j�?:#W]�F:,�G'H���|��+��������]yb�#��VW�$C,�����K�|k
K&�������H�z�2��f��KqS�����T�J��K��R���~<�u�����
��y��P���B��̭1H�Q�q�%E{)�ۣd�M�7oFB m����6+Lfm,wW���(�d�p�{)xqM�"�v��;�ๅ0dAF��6���f]�z�o5���%'�s�OgY͖T�vε��p.I:lp�N�v����Q4�e,q^b�C�,��2��2�#m�N�f�,�`g���
&��������w9{5�#�YW5�v_ƶ=}�$�&G�T4�x@�U3n�bҾk᷿��8&*w�W���鼭s��I^��F�{>h���o��q�w.*��V�^�{6�J�H�	���1��,�����?����U6ދ�۠���~����?��m��_�+�C ���a�Mv�8)��7��ن�)��J�i�t�T)~�~){�����WC���|Q�b�0��j��o�Z�ф�@څ.i�+�w����d9x5'�O���A�򰥎Y�� �[�+*$o�A������^��	먾E���ը��U���Dej��i_�c2�z�i�f���p����m����/�CA����\�owww����      �   �   x���=�0��99E/@��sҤ^�����9��S�"���$F�0�d�A`YM�hΓ�k8O{D���'�H�F0��U��ᧈ�ULQ;pQ�ֺ�:G�dP펙DA$����Z`dj�l9�X_�X}3�d���z�>6��p��jc*����m(�+&����blh:�X_���c��1      �   �  x�mRMK1<'����~�E� ���(�`���[�(<�`��."bAZы�C����'Qڮ�H޼y�fRc�Uq�#:��Tt�9����T.�sGپFa�Z��)jz�t��]�_d�	��_�G�����s��PKi���ܪ����2nx�KQ-�@SǙڛ�CB*J�g*SNo�ȗغ��7J��WAR�Pc��B����� z4t�AP[��x~��h��v�3�Ŗ�2[�YL�A�Zn�	���ƥM��A�����.nќF5�m��c:�}\��H5�k��3O��W��;s�-���+�W:L1�t$C���?E���~��	xQ6I���U�;[�=��Q�s�'ޟ�$��g*�6����Y%��M��Ju���zl{ ��B��Ч��`:�q�¾c���|�R��L�K�V k@Z�^\�5���9����      �   �   x�3�t���w	�t�t�x�{�BJi����%����(�<ܵX���ᮅy�
%�f*rq�8��Ǉx�:�{x��q���~�{c�BF&Pw.�F\�@����~@�<��/V��?� �dA^.��\&�!��@�zr�<ܽZ!h��L\�M�LA6A|����L�b���� =?r�      �   g   x�u�1AC�:9�^��O���[C�D��?[����+L�=�;@�wD^p������eL���_���eb��\��K%�ξ�����uam@1��Ma�����!P      �   	  x��X]s�H}��
=���KR��� �d°���TMu䎥X�6�G��{ZȀc�jk����{��ۜ��E��2����%�i���t]��9~p�ԓԕ$�uff�,u]�]5�$�1�E�������yrrO~s�B&�C���'�:a�D%<
?}$�;S�y��k]5�%ͼ2ƚi��jy\��qv� ���HR9�
�&�~X�ȕ)�68��"�FmKS�v���kJ��`%	%�"��zX����h#�A7U�.��4�~�kƦ�nWM\5�3"a��d�jt`�cr�����C�A�5)�ef*��7����ՙs��I�H�8�b������S@��!_\f�:�k��.�ɕ"�!���� ,S�}���g�[[|w�w�2vZ:W��,��s[O�i~�V$�"�E�-+@��c�����68-̓�3S�2O3m
�΅*�L��w\|z�)%Wyyg���yaZve�dUk��,o�NXJB�D\J0y��=�XY)C�Z�ߛ*83��Ռ���E*�T�0�~��c|z�A������:���(H��k��=b�)����T��޻_�!RRQ)m��w�:���\8�i��l��M��ntᓍ��K,��r�d�\����_r*�˂��-D�L$@"��Z\������\Q,7��'�ғ��#��+7���,�ȅ.�K�g�u��W��}ޠ�@��R����
�%���KW�pL�7]��J5���u�_>����v54�+��
�Eq�\���N�kduK3Kg��i��c���=�p�W��R6�S���R�ܭ�ƚ6��|�iנޞC�� f\mE�z����d#�[p*��S1mm��z����v�l�u�R��;���!_è`a�cc�f��s�Yf��J���T�l��_�N�iX����c�5L ��kXU��Gw�������d:_=�zgaq*T��"�b:��.����:k��,���]��}ӂy��`
�=�o�ָ�1A�L�羅�qU��B��+���"�8��C#3�5�8��$�Ѝ��#�f�"��S`Ȗ�|��d��g#��f�p�B.��.���
cw�,F�blk���WJ6֥�}�����3��d�F�N�$e	�C����Ȓ~6�i��Igw�f����P���ഘ�'zH9�6sO�kWi�A^#�=�T~���'[��z�<#�%��2��wݵ��09��� ���(�yޕ_#"!ށF<�L�qm䔜j�|pi��ck���ř0�*�5���q�rF���~K�cnSc�DMkW8L��
�c�S�ӈo�zqR0	���͂k������>E�H.��Q[ւ��Ҍ	;�?C��w�b�G]����ړ_�M�`,��M��� XIN�68��:6�M�#9}y��k��*J�m�7,��@hқUY���D��>���r�r��qJ�����h�1��f3�Xc��e��Gm�i����߅-Rq"��a����8����M��vאz5����8���o��+�>���]��A��Β(p=�˟A�QEa�Y: �ޫ�>Z��j�b�+�%��.ۄ��p����6�(®��$(9��~����J�/�8���ɖ�@��\V,����"K�*6{��]�SP�X���Е����Ar��X8��t���f���}�j�6��TǙ�J�ć�Pv�=g��4gB�Sx}0'��;�@�i�g'��/0(�� &����4!�;���UM�u��0s/���]��|���� 1[�6/� M]eڄo��qa�y�s���F�~nс(b�MM�јy�3�z��B$��P[*�(!r�)Р�6�y[��ޖ�*��E��29p���S���Z��״�K�d{.�@�0:U��F�r;��~��5&I�������~M�
q�����i��R��7h�����0��Y�Ƌ�~�B�����,�*C��+־��բ���g���.�^�iuW���2Q�Ú��x�x9���Wo�߼�M���z���x��I±��[s��S�����qm�O�W�#��n��2����t�zs՝7}^�7���\N���I��ߓ���e�~���/�'��|����6�����T�������ܔ�P�ݔ��\�|4��X�~���x�Hb݈íwV������:RFwV���F&,8i6��)�;��D�	�ݎ28�w�g����{���%\�8�zig���y�3Ѻ��N�_ջ�<y�?�����?��._;�z�#siy�tq)�L�o?���.OW��sy59�cG�����8��D�⺡���������	�*      �   �   x�e��jAE�ݯ� ��O��J�f�����D�]�L�B,RaED"�� )&��O|�Bv!�0�=���d@��`��?����*���I��¨bQ����П�P82��z��x-8ǈ&԰4(Cg������ӧ�B�6��r����L?��Mw8�h��]�w�u�}_O�K�J���K���6���n6Qx�i!���{��؞6�z7�S��藇4Mo`c��     