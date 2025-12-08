// GENERATED — dari openapi.yaml. Jangan edit manual.
// Regenerasi: npm run gen:api
export interface paths {
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Login (email + password) */
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Refresh access token */
        post: operations["refreshToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Logout & revoke refresh token */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Profil user aktif + scope aktif (hotel/region) */
        get: operations["getMe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/hotels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar hotel dalam scope user (dropdown Switch Active Hotel — A1) */
        get: operations["listMyHotels"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/switch-hotel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Ganti Active Hotel (session scope) */
        post: operations["switchHotel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/locale": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Set preferensi bahasa user (F-22) */
        patch: operations["setLocale"];
        trace?: never;
    };
    "/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar user (scoped — delegasi GM hanya user unitnya; ROOT semua) */
        get: operations["listUsers"];
        put?: never;
        /** Buat user (Delegated Admin scoped — A3) */
        post: operations["createUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        /** Detail user */
        get: operations["getUser"];
        put?: never;
        post?: never;
        /** Nonaktifkan / kembalikan akun (soft delete) */
        delete: operations["deactivateUser"];
        options?: never;
        head?: never;
        /** Update user (attr. scoped, nonaktifkan akun) */
        patch: operations["updateUser"];
        trace?: never;
    };
    "/users/{id}/reset-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reset password (Delegated admin dalam scope) */
        post: operations["resetPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar role + permission codes */
        get: operations["listRoles"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/roles/{id}/permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Set permission role (khusus ROOT_ADMIN — A4) */
        put: operations["setRolePermissions"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/hotels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar hotel (filter brand_tier, region, status, mice facility) */
        get: operations["listHotels"];
        put?: never;
        /** Tambah master hotel baru (ROOT_ADMIN) */
        post: operations["createHotel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/hotels/{code}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        /** Detail hotel (by Code atau UUID) */
        get: operations["getHotel"];
        put?: never;
        post?: never;
        /** Soft delete master hotel (ROOT_ADMIN) */
        delete: operations["deleteHotel"];
        options?: never;
        head?: never;
        /** Update master hotel (ROOT_ADMIN) */
        patch: operations["updateHotel"];
        trace?: never;
    };
    "/hotels/{code}/departments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Departemen hotel */
        get: operations["listHotelDepartments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/hotels/{code}/contacts": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        /** Daftar kontak operasional PIC hotel */
        get: operations["listHotelContacts"];
        put?: never;
        /** Tambah kontak PIC hotel baru */
        post: operations["createHotelContact"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/hotels/{code}/contacts/{contactId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
                contactId: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Hapus kontak PIC hotel */
        delete: operations["deleteHotelContact"];
        options?: never;
        head?: never;
        /** Update kontak PIC hotel */
        patch: operations["updateHotelContact"];
        trace?: never;
    };
    "/cities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar master kota */
        get: operations["listCities"];
        put?: never;
        /** Tambah master kota baru */
        post: operations["createCity"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cities/{cityId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cityId: string;
            };
            cookie?: never;
        };
        /** Detail master kota */
        get: operations["getCity"];
        put?: never;
        post?: never;
        /** Hapus master kota */
        delete: operations["deleteCity"];
        options?: never;
        head?: never;
        /** Update master kota */
        patch: operations["updateCity"];
        trace?: never;
    };
    "/brands": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar brand dengan paginasi, filter tier dan status */
        get: operations["listBrands"];
        put?: never;
        /** Tambah master brand baru */
        post: operations["createBrand"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/brands/{code}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Konfigurasi brand_tier (PRD-F-01 — checklist dinamis menyesuaikan tipe hotel) */
        patch: operations["updateBrandTier"];
        trace?: never;
    };
    "/regions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar region dengan paginasi dan filter */
        get: operations["listRegions"];
        put?: never;
        /** Tambah master wilayah baru */
        post: operations["createRegion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/regions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detail wilayah beserta statistik properti & ROM */
        get: operations["getRegion"];
        put?: never;
        post?: never;
        /** Soft-delete wilayah (ditolak bila ada hotel aktif) */
        delete: operations["deleteRegion"];
        options?: never;
        head?: never;
        /** Update data wilayah atau transisi status FSM */
        patch: operations["updateRegion"];
        trace?: never;
    };
    "/provinces": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar provinsi (utk SBM lookup) */
        get: operations["listProvinces"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checklist/templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar template checklist (filter brand_tier / department) */
        get: operations["listTemplates"];
        put?: never;
        /** Buat template (status DRAFT) */
        post: operations["createTemplate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checklist/templates/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        /** Detail template + sections + items (localized via Accept-Language) */
        get: operations["getTemplate"];
        put?: never;
        post?: never;
        /** Soft-delete template (hanya template DRAFT yang belum dipakai sesi audit) */
        delete: operations["deleteTemplate"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checklist/templates/{id}/versions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Buka versi baru (copy LOCKED → DRAFT vX.Y) — B2 anti-refactor */
        post: operations["createTemplateVersion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checklist/templates/{id}/lock": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Lock template (immutable — snapshot sesi audit B3) */
        post: operations["lockTemplate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checklist/templates/{id}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Arsipkan template (hanya template LOCKED) */
        post: operations["archiveTemplate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checklist/templates/{id}/sections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Tambah section (hanya template DRAFT) */
        post: operations["createSection"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checklist/templates/{id}/sections/{sectionId}/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Tambah item pertanyaan (rubrik TTL/NUMERIC/MULTI_ROOM/BINARY) */
        post: operations["createItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checklist/templates/{id}/sections/{sectionId}/items/{itemId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                sectionId: string;
                itemId: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update rubrik item (hanya template DRAFT) — rubric_type/max_score/weight/na/is_life_safety */
        patch: operations["updateItem"];
        trace?: never;
    };
    "/audit/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar sesi audit (filter hotel, department, status, periode, origin) */
        get: operations["listSessions"];
        put?: never;
        /** Buat sesi audit (bind template terkunci B3) */
        post: operations["createSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/sessions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        /** Detail sesi + item scores + findings */
        get: operations["getSession"];
        put?: never;
        post?: never;
        /** Batalkan / hapus sesi audit (hanya status DRAFT) */
        delete: operations["deleteSession"];
        options?: never;
        head?: never;
        /** Update sesi audit (hanya status DRAFT) */
        patch: operations["updateSession"];
        trace?: never;
    };
    "/audit/sessions/{id}/submit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Submit sesi (auditor selesai input) */
        post: operations["submitSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/sessions/{id}/reopen": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reopen sesi audit (Corporate QA mengembalikan SUBMITTED ke IN_PROGRESS) */
        post: operations["reopenSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/sessions/{id}/publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Publish laporan (finalize scoring PASS/FAIL F-02) */
        post: operations["publishSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/sessions/{id}/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upsert batch nilai (live/online — field-level timestamp F-05) */
        post: operations["bulkUpsertScores"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/sessions/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Push batch offline (dedupe client_id, timestamp-merge F-05) */
        post: operations["syncPush"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/sessions/{id}/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Pull perubahan sejak timestamp (incremental sync F-05) */
        get: operations["syncPull"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/sessions/{id}/conflicts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar konflik sinkronisasi (F-05) */
        get: operations["listConflicts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/sessions/{id}/conflicts/{conflictId}/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Resolve konflik (pilih nilai menang — field-level F-05) */
        post: operations["resolveConflict"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/sessions/{id}/media": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar media sesi (status upload) */
        get: operations["listMedia"];
        put?: never;
        /** Register media → return presigned upload URL (C2 split-path) */
        post: operations["registerMedia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/sessions/{id}/media/{mediaId}/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Konfirmasi upload selesai + set status (C2) */
        post: operations["confirmMedia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/sessions/{id}/report.pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Ekspor laporan PDF (localized via Accept-Language) */
        get: operations["getSessionReport"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/audit/logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Trail audit korporat (audit_logs) — hanya scope korporat / `users` */
        get: operations["listAuditLogs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ingest/batches": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar batch ingestion (F-21) */
        get: operations["listBatches"];
        put?: never;
        /** Upload file legacy (multipart xlsx) */
        post: operations["createBatch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ingest/batches/{id}/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Jalankan import (validate → legacy_score_rows → agregat legacy sessions D3) */
        post: operations["runBatch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ingest/batches/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detail batch + fail log */
        get: operations["getBatch"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/analytics/yoy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** YoY trend score per hotel/departemen (F-21/12) */
        get: operations["getYoY"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dashboard/heatmap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Geo-heatmap 106 hotel + Risk Index (F-12) */
        get: operations["getHeatmap"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dashboard/risk-index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Risiko per hotel (life-safety blink F-12) */
        get: operations["getRiskIndex"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dashboard/hotels/{hotelId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Drill-down performa satu hotel */
        get: operations["getHotelDrilldown"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/dashboard/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Agregat operasional dashboard (hero stats + CAPA pipeline + SLA + insights) */
        get: operations["getDashboardOverview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capa/tickets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar tiket CAPA (filter prioritas, status, SLA overdue) */
        get: operations["listTickets"];
        put?: never;
        /** Buat tiket dari finding (auto-settle SLA F-03) atau manual ad-hoc */
        post: operations["createTicket"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capa/tickets/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        /** Detail tiket + media + history */
        get: operations["getTicket"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update metadata tiket (khusus status OPEN / IN_PROGRESS) */
        patch: operations["updateTicket"];
        trace?: never;
    };
    "/capa/tickets/{id}/assign": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Assign ke resolver (HOD/EHK) */
        post: operations["assignTicket"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capa/tickets/{id}/resolve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Teknisi submit perbaikan (foto After + register media) */
        post: operations["resolveTicket"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capa/tickets/{id}/verify/gm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * GM review & endorse (First Approver) — hierarki approval (7d)
         * @description APPROVE ║ Four-Eyes gate (7d) — wajib ≥1 CapaMedia AFTER VERIFIED (split-path 7c) dan approver ≠ assignee (≠ reporter utk WHISTLEBLOWER); tanpa bukti → 409. REJECT tidak digate (menolak krn bukti kurang).
         */
        post: operations["verifyGm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capa/tickets/{id}/verify/qa": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Corporate QA verifikasi akhir & tutup tiket (Final Approver) — 7d
         * @description CLOSE ║ same Four-Eyes gate (7d): wajib bukti AFTER VERIFIED + approver ≠ assignee (≠ reporter utk WHISTLEBLOWER); tanpa bukti → 409. REOPEN tidak digate.
         */
        post: operations["verifyQa"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capa/tickets/{id}/escalate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Trigger auto-escalation SLA (system/capa receiver) */
        post: operations["escalateTicket"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capa/tickets/{id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Riwayat transisi status (audit trail) */
        get: operations["ticketHistory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capa/tickets/{id}/media": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar bukti media + komparasi BEFORE vs AFTER (verification hub) */
        get: operations["listTicketMedia"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capa/tickets/{id}/media/{media_id}/presign-get": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Presigned GET URL bukti media (verification hub, expire 5 mnt)
         * @description Hanya media VERIFIED yang bisa di-presign-GET (objek benar ada); PENDING/PRESIGNED/FAILED → 409 (Constraint G4 — data jujur, tanpa stub gambar).
         */
        get: operations["presignGetTicketMedia"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capa/tickets/{id}/media/{media_id}/presign": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Keluarkan presigned PUT URL (expire 7 mnt, renew diizinkan) */
        post: operations["presignTicketMedia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/capa/tickets/{id}/media/{media_id}/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Konfirmasi upload → verify object (size/mime) → VERIFIED / FAILED */
        post: operations["confirmTicketMedia"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/crm/leads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar leads (scoped hotel — tenant isolation) */
        get: operations["listLeads"];
        put?: never;
        /** Buat lead manual / dari RFP */
        post: operations["createLead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/crm/leads/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        /** Detail lead + aktivitas + quotation */
        get: operations["getLead"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update lead (status; lost → lost_reason wajib F-07) */
        patch: operations["updateLead"];
        trace?: never;
    };
    "/crm/leads/{id}/activities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Catat aktivitas follow-up (reminder F-07) */
        post: operations["addLeadActivity"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/crm/leads/{id}/refer": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Cross-property referral (F-08 — jalur legal antar unit) */
        post: operations["referLead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/crm/quotations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar quotation (scoped) */
        get: operations["listQuotations"];
        put?: never;
        /** Generate quotation (verifikasi pagu SBM F-09 + snapshot E3) */
        post: operations["createQuotation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/crm/quotations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        /** Detail quotation + milestones */
        get: operations["getQuotation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update quotation status FSM atau approval diskon (F-09) */
        patch: operations["updateQuotation"];
        trace?: never;
    };
    "/crm/quotations/{id}/pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Generate PDF proposal ber-kop + barcode (F-09) */
        post: operations["generateQuotationPdf"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/crm/sbm-rates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lihat SBM rates (provinsi × package × tahun) */
        get: operations["listSbmRates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/crm/sbm-rates/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update SBM rate (Corporate DOSM — E2, perubahan PMK) */
        patch: operations["updateSbmRate"];
        trace?: never;
    };
    "/crm/analytics/lost-reasons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lost Reason analytics per kuartal (F-07) — breakdown alasan + trend */
        get: operations["getLostReasonAnalytics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/crm/billing": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Daftar milestone (scoped finance) */
        get: operations["listMilestones"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/crm/billing/milestones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Buat milestone (SPK/NPWP/BAST/LPJ) */
        post: operations["createMilestone"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/crm/billing/milestones/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        /** Detail milestone dinas */
        get: operations["getMilestone"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update milestone (upload dokumen, mark PAID) */
        patch: operations["updateMilestone"];
        trace?: never;
    };
    "/frontpage/catalog": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Katalog publik 106 hotel + paket (localized, filter mice) */
        get: operations["publicCatalog"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/frontpage/packages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Paket MICE pemerintah (localized ID/EN) */
        get: operations["publicPackages"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/frontpage/rfp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Submit RFP publik → auto-create lead (F-11) */
        post: operations["publicRfp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/translations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Ambil kumpulan terjemahan (bulk per locale/entity) */
        get: operations["getTranslations"];
        /** Upsert terjemahan (content admin) */
        put: operations["putTranslations"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Inbox notifikasi user */
        get: operations["listNotifications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Tandai dibaca */
        post: operations["markNotificationRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/notifications/remind-billing": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Sweep reminder billing dinas (F-10) — BILLING_REMINDER jelang tutup TA */
        post: operations["runBillingReminder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/brands/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detail brand beserta daftar hotel terafiliasi */
        get: operations["getBrand"];
        /** Update data brand */
        put: operations["updateBrand"];
        post?: never;
        /** Soft-delete brand (ditolak bila ada hotel aktif terhubung) */
        delete: operations["deleteBrand"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/brands/{code}/tier": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Konfigurasi brand_tier (PRD-F-01) */
        patch: operations["updateBrandTierDirect"];
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ApiErrorResponse: {
            /** @example false */
            success?: boolean;
            /** @example Terjadi kesalahan */
            message?: string;
            /** @example AUTH_FAILED */
            error_code?: string;
        };
        ApiValidationError: {
            /** @example false */
            success?: boolean;
            /** @example Validasi gagal */
            message?: string;
            errors?: {
                [key: string]: string[];
            };
        };
        PaginationMeta: {
            current_page?: number;
            per_page?: number;
            total?: number;
            last_page?: number;
        };
        LoginRequest: {
            /** Format: email */
            email: string;
            password: string;
        };
        LoginResponse: {
            /** @example true */
            success?: boolean;
            message?: string;
            data?: {
                access_token?: string;
                refresh_token?: string;
                user?: components["schemas"]["User"];
            };
        };
        User: {
            /** Format: uuid */
            id?: string;
            /** Format: email */
            email?: string;
            name?: string;
            phone?: string;
            /**
             * @example id
             * @enum {string}
             */
            preferred_locale?: "id" | "en";
            is_active?: boolean;
            /** Format: date-time */
            last_login_at?: string | null;
            /** Format: date-time */
            created_at?: string;
            /** Format: date-time */
            updated_at?: string;
        };
        Role: {
            /** Format: uuid */
            id?: string;
            /** @example HOTEL_GM */
            code?: string;
            name?: string;
            scope_level?: number;
            is_system?: boolean;
        };
        RoleWithPermissions: components["schemas"]["Role"] & {
            permissions?: components["schemas"]["Permission"][];
        };
        Permission: {
            /** Format: uuid */
            id?: string;
            /** @example user:manage:global */
            code?: string;
            module?: string;
            action?: string;
            description?: string;
        };
        UserCreateRequest: {
            /** Format: email */
            email: string;
            name: string;
            phone?: string;
            /** @enum {string} */
            role_code: "ROOT_ADMIN" | "CORP_EXEC" | "CORP_AUDITOR" | "REGIONAL_ROM" | "HOTEL_GM" | "HOTEL_HOD_TECH" | "HOTEL_SALES" | "HOTEL_FINANCE" | "PUBLIC_CLIENT";
            /** @description Wajib utk role unit; boleh >1 (Cluster GM) */
            hotel_ids?: string[];
            /** Format: uuid */
            region_id?: string;
            /**
             * @default id
             * @enum {string}
             */
            preferred_locale: "id" | "en";
            password?: string;
        };
        UserUpdateRequest: {
            name?: string;
            phone?: string;
            /** @enum {string} */
            preferred_locale?: "id" | "en";
            is_active?: boolean;
            add_hotel_ids?: string[];
            remove_hotel_ids?: string[];
        };
        Brand: {
            /** Format: uuid */
            id: string;
            code: string;
            name: string;
            /** @enum {string} */
            tier: "Luxury" | "Upscale" | "Boutique" | "Midscale" | "Budget" | "Eco-Resort";
            /**
             * @default ACTIVE
             * @enum {string}
             */
            status: "ACTIVE" | "INACTIVE" | "RETIRED";
            /** @default 0 */
            hotels_count: number;
            /** Format: date-time */
            created_at?: string | null;
            /** Format: date-time */
            updated_at?: string | null;
        };
        BrandTierUpdateRequest: {
            /** @enum {string} */
            tier: "Luxury" | "Upscale" | "Boutique" | "Midscale" | "Budget" | "Eco-Resort";
        };
        Region: {
            /** Format: uuid */
            id?: string;
            code?: string;
            name?: string;
            country?: string;
            sales_region?: string | null;
            ecommerce_region?: string | null;
            /**
             * @default ACTIVE
             * @enum {string}
             */
            status: "ACTIVE" | "INACTIVE" | "RETIRED";
            /** Format: date-time */
            created_at?: string | null;
            /** Format: date-time */
            updated_at?: string | null;
        };
        RegionDetail: components["schemas"]["Region"] & {
            /** @example 12 */
            hotels_count?: number;
            rom_names?: string[];
        };
        RegionCreateRequest: {
            /** @example JABAR */
            code: string;
            /** @example West Java */
            name: string;
            /** @default Indonesia */
            country: string;
            /** @example Java Sales Division */
            sales_region?: string | null;
            ecommerce_region?: string | null;
            /**
             * @default ACTIVE
             * @enum {string}
             */
            status: "ACTIVE" | "INACTIVE" | "RETIRED";
        };
        RegionUpdateRequest: {
            code?: string;
            name?: string;
            country?: string;
            sales_region?: string | null;
            ecommerce_region?: string | null;
            /** @enum {string} */
            status?: "ACTIVE" | "INACTIVE" | "RETIRED";
        };
        Province: {
            /** Format: uuid */
            id?: string;
            code?: string;
            name?: string;
        };
        Department: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            hotel_id?: string;
            /** @enum {string} */
            code?: "GM" | "HOUSEKEEPING" | "KITCHEN_FB" | "SECURITY_RISK";
            name?: string;
            /** Format: uuid */
            hod_user_id?: string | null;
        };
        City: {
            /** Format: uuid */
            id: string;
            name: string;
            /** Format: uuid */
            province_id: string;
            province?: string | null;
            /** Format: uuid */
            region_id: string;
            region?: string | null;
            ecommerce_city?: string | null;
        };
        CityCreateRequest: {
            /** @example Surabaya */
            name: string;
            /** Format: uuid */
            province_id: string;
            /** Format: uuid */
            region_id?: string | null;
            /** @example Surabaya Area */
            ecommerce_city?: string | null;
        };
        CityUpdateRequest: {
            name?: string;
            /** Format: uuid */
            province_id?: string | null;
            /** Format: uuid */
            region_id?: string | null;
            ecommerce_city?: string | null;
        };
        HotelContact: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            contact_type: "GM" | "SALES" | "FINANCE" | "ROM";
            name: string;
            email?: string | null;
            phone?: string | null;
            /** Format: uuid */
            user_id?: string | null;
            /** Format: uuid */
            hotel_id?: string | null;
            hotel_code?: string | null;
            hotel_name?: string | null;
            /** @default true */
            is_primary: boolean;
        };
        HotelContactCreateRequest: {
            /** @enum {string} */
            contact_type: "GM" | "SALES" | "FINANCE" | "ROM";
            name: string;
            email?: string | null;
            phone?: string | null;
            /** Format: uuid */
            user_id?: string | null;
            /** @default true */
            is_primary: boolean;
        };
        HotelContactGlobalCreateRequest: {
            /** Format: uuid */
            hotel_id: string;
            /** @enum {string} */
            contact_type: "GM" | "SALES" | "FINANCE" | "ROM";
            name: string;
            email?: string | null;
            phone?: string | null;
            /** Format: uuid */
            user_id?: string | null;
            /** @default true */
            is_primary: boolean;
        };
        HotelContactUpdateRequest: {
            /** Format: uuid */
            hotel_id?: string | null;
            /** @enum {string|null} */
            contact_type?: "GM" | "SALES" | "FINANCE" | "ROM" | null;
            name?: string | null;
            email?: string | null;
            phone?: string | null;
            /** Format: uuid */
            user_id?: string | null;
            is_primary?: boolean | null;
        };
        Hotel: {
            /** Format: uuid */
            id?: string;
            /** @example CWS */
            code?: string;
            name?: string;
            /** Format: uuid */
            brand_id?: string;
            brand?: string;
            brand_tier?: string;
            /** Format: uuid */
            region_id?: string;
            region?: string;
            /** Format: uuid */
            province_id?: string;
            /** Format: uuid */
            city_id?: string | null;
            city?: string;
            ecommerce_city?: string | null;
            sales_region?: string | null;
            ecommerce_region?: string | null;
            geo?: {
                /** Format: double */
                lat?: number;
                /** Format: double */
                lng?: number;
            };
            /** @example 200 */
            geofence_radius_meters?: number;
            /**
             * @example {
             *       "ballroom_capacity": 500,
             *       "meeting_rooms": 5,
             *       "has_videotron": true
             *     }
             */
            mice_facilities?: Record<string, never>;
            /** @enum {string} */
            status?: "ACTIVE" | "TEMPORARILY_CLOSED" | "TERMINATED";
            image_url?: string | null;
            /** @default true */
            has_fb: boolean;
            /** Format: date */
            opening_date?: string | null;
            /** Format: date */
            terminate_date?: string | null;
            /** Format: date-time */
            period_update?: string | null;
            gm_name?: string;
            rom_name?: string;
            contacts?: components["schemas"]["HotelContact"][];
        };
        HotelCreateRequest: {
            /** @example CWS */
            code: string;
            /** @example Swiss-Belhotel Cirebon */
            name: string;
            /** Format: uuid */
            brand_id: string;
            /** Format: uuid */
            region_id: string;
            /** Format: uuid */
            province_id: string;
            /** Format: uuid */
            city_id?: string | null;
            /** @example Cirebon */
            city: string;
            geo: {
                /** Format: double */
                lat: number;
                /** Format: double */
                lng: number;
            };
            /** @default 200 */
            geofence_radius_meters: number;
            mice_facilities?: {
                ballroom_capacity?: number;
                meeting_rooms?: number;
                has_videotron?: boolean;
            };
            /** Format: uuid */
            gm_id?: string | null;
            /** Format: uuid */
            rom_id?: string | null;
            /** Format: date */
            opening_date?: string | null;
            /** Format: date */
            terminate_date?: string | null;
            /**
             * @default ACTIVE
             * @enum {string}
             */
            status: "ACTIVE" | "TEMPORARILY_CLOSED" | "TERMINATED";
            image_url?: string | null;
            /** @default true */
            has_fb: boolean;
            contacts?: components["schemas"]["HotelContactCreateRequest"][];
        };
        HotelUpdateRequest: {
            code?: string;
            name?: string;
            /** Format: uuid */
            brand_id?: string;
            /** Format: uuid */
            region_id?: string;
            /** Format: uuid */
            province_id?: string;
            /** Format: uuid */
            city_id?: string | null;
            city?: string;
            geo?: {
                /** Format: double */
                lat?: number;
                /** Format: double */
                lng?: number;
            };
            geofence_radius_meters?: number;
            mice_facilities?: {
                ballroom_capacity?: number;
                meeting_rooms?: number;
                has_videotron?: boolean;
            };
            /** Format: uuid */
            gm_id?: string | null;
            /** Format: uuid */
            rom_id?: string | null;
            /** Format: date */
            opening_date?: string | null;
            /** Format: date */
            terminate_date?: string | null;
            /** @enum {string} */
            status?: "ACTIVE" | "TEMPORARILY_CLOSED" | "TERMINATED";
            image_url?: string | null;
            has_fb?: boolean;
            contacts?: components["schemas"]["HotelContactCreateRequest"][];
        };
        ChecklistTemplate: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            department: "GM" | "HOUSEKEEPING" | "KITCHEN_FB" | "SECURITY_RISK";
            name: string;
            /** @example v2026.1 */
            version: string;
            brand_tier?: string | null;
            /** @enum {string} */
            status: "DRAFT" | "LOCKED" | "ARCHIVED";
            /** Format: date-time */
            locked_at?: string | null;
            /** Format: uuid */
            published_by?: string;
        };
        TemplateCreateRequest: {
            /** @enum {string} */
            department: "GM" | "HOUSEKEEPING" | "KITCHEN_FB" | "SECURITY_RISK";
            name: string;
            /** @example v2026.1 */
            version: string;
            /** @enum {string} */
            brand_tier?: "Luxury" | "Upscale" | "Boutique" | "Midscale" | "Budget" | "Eco-Resort";
        };
        ChecklistSection: {
            /** Format: uuid */
            id: string;
            code: string;
            name: string;
            /** Format: uuid */
            parent_id?: string | null;
            sort_order: number;
        };
        ChecklistItem: {
            /** Format: uuid */
            id: string;
            code: string;
            question_text: string;
            question_localized?: string | null;
            /** @enum {string} */
            rubric_type: "TRAFFIC_LIGHT" | "NUMERIC_SCALE" | "MULTI_ROOM" | "BINARY_COUNT";
            /** Format: double */
            max_score: number;
            /** Format: double */
            weight: number;
            na_allowed: boolean;
            is_life_safety: boolean;
            sort_order: number;
        };
        TemplateDetail: {
            template: components["schemas"]["ChecklistTemplate"];
            sections: (components["schemas"]["ChecklistSection"] & {
                items?: components["schemas"]["ChecklistItem"][];
            })[];
        };
        ItemCreateRequest: {
            code: string;
            question_text: string;
            /** @enum {string} */
            rubric_type: "TRAFFIC_LIGHT" | "NUMERIC_SCALE" | "MULTI_ROOM" | "BINARY_COUNT";
            /** Format: double */
            max_score: number;
            /**
             * Format: double
             * @default 1
             */
            weight: number;
            /** @default false */
            na_allowed: boolean;
            /** @default false */
            is_life_safety: boolean;
            /** @default 0 */
            sort_order: number;
        };
        ItemUpdateRequest: {
            question_text?: string;
            /** @enum {string} */
            rubric_type?: "TRAFFIC_LIGHT" | "NUMERIC_SCALE" | "MULTI_ROOM" | "BINARY_COUNT";
            /** Format: double */
            max_score?: number;
            /** Format: double */
            weight?: number;
            na_allowed?: boolean;
            is_life_safety?: boolean;
            sort_order?: number;
        };
        AuditSession: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            hotel_id: string;
            hotel_code: string;
            hotel_name: string;
            /** Format: uuid */
            template_id: string;
            template_version?: string | null;
            department: string;
            /** @enum {string} */
            audit_type: "FULL" | "MICRO" | "FOLLOWUP";
            /** @enum {string} */
            status: "DRAFT" | "IN_PROGRESS" | "SUBMITTED" | "PUBLISHED";
            /** Format: uuid */
            auditor_id: string;
            auditor_name: string;
            /** Format: date */
            date_start: string;
            /** Format: date */
            date_end?: string | null;
            /** Format: date-time */
            published_at?: string | null;
            /** Format: double */
            total_score?: number | null;
            /** @enum {string|null} */
            pass_fail?: "PASS" | "FAIL" | null;
            /** @enum {string} */
            origin: "SYSTEM" | "LEGACY";
            /** @enum {string} */
            sync_status: "SYNCED" | "PENDING_CONFLICT";
        };
        AuditSessionCreateRequest: {
            /** Format: uuid */
            hotel_id: string;
            /**
             * Format: uuid
             * @description Kosong = template LOCKED terbaru utk (department
             */
            template_id?: string;
            /** @enum {string} */
            department: "GM" | "HOUSEKEEPING" | "KITCHEN_FB" | "SECURITY_RISK";
            /** @enum {string} */
            audit_type: "FULL" | "MICRO" | "FOLLOWUP";
            /** Format: date */
            date_start?: string;
            /**
             * Format: uuid
             * @description Dihasilkan mobile saat offline (dedupe F-05)
             */
            client_id?: string;
        };
        AuditSessionUpdateRequest: {
            /** @enum {string} */
            department?: "GM" | "HOUSEKEEPING" | "KITCHEN_FB" | "SECURITY_RISK";
            /** @enum {string} */
            audit_type?: "FULL" | "MICRO" | "FOLLOWUP";
            /** Format: date */
            date_start?: string;
            /** Format: date */
            date_end?: string | null;
        };
        ScoreUpsert: {
            /** Format: uuid */
            item_id: string;
            room_ref?: string | null;
            value: string;
            /** @default false */
            is_na: boolean;
            note?: string;
            /** Format: date-time */
            scored_at?: string;
            /** Format: date-time */
            updated_at?: string;
        };
        AuditItemScore: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            session_id?: string;
            /** Format: uuid */
            item_id?: string;
            room_ref?: string | null;
            value?: string;
            /** Format: double */
            score?: number;
            is_na?: boolean;
            note?: string;
            /** Format: uuid */
            scored_by?: string;
            /** Format: date-time */
            updated_at?: string;
            code?: string | null;
            question_text?: string | null;
            rubric_type?: string | null;
            /** Format: double */
            max_score?: number | null;
            is_life_safety?: boolean | null;
            sort_order?: number | null;
            section_code?: string | null;
            section_name?: string | null;
        };
        SyncPushRequest: {
            /** Format: uuid */
            session_client_id: string;
            scores: components["schemas"]["ScoreUpsert"][];
            media_events?: {
                /** Format: uuid */
                local_media_id?: string;
                /** @enum {string} */
                status?: "PENDING" | "UPLOADED" | "FAILED";
                object_key?: string;
            }[];
            /** Format: date-time */
            device_now?: string;
        };
        SyncPushResult: {
            /** Format: uuid */
            session_id?: string;
            upserted?: number;
            conflicts?: number;
            conflict_ids?: string[];
            /** Format: date-time */
            server_now?: string;
        };
        SyncConflict: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            session_id?: string;
            /** Format: uuid */
            item_id?: string;
            room_ref?: string | null;
            server_value?: string;
            device_value?: string;
            /** @enum {string|null} */
            resolution?: "TIMESTAMP_MERGE" | "MANUAL" | null;
            /** Format: date-time */
            resolved_at?: string | null;
        };
        MediaRegisterRequest: {
            /** @enum {string} */
            phase: "BEFORE" | "AFTER";
            /** Format: uuid */
            finding_id?: string | null;
            /** Format: uuid */
            item_id?: string | null;
            /**
             * @description F-04 gallery disabled
             * @enum {string}
             */
            source_camera?: "LIVE_CAMERA";
            /** @enum {string} */
            mime: "image/webp";
            width: number;
            height: number;
            size_bytes: number;
            /** @example sha256 hex */
            checksum_sha256?: string;
            /** Format: double */
            gps_lat?: number;
            /** Format: double */
            gps_lng?: number;
            /** @default true */
            gps_valid: boolean;
            /** Format: date-time */
            captured_at: string;
        };
        AuditMedia: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            session_id?: string;
            /** @enum {string} */
            phase?: "BEFORE" | "AFTER";
            object_key?: string;
            mime?: string;
            size_bytes?: number;
            gps_valid?: boolean;
            watermark_meta?: {
                hotel?: string;
                /** Format: date-time */
                server_timestamp?: string;
                auditor?: string;
                gps?: boolean;
            };
            /** @enum {string} */
            upload_status?: "PENDING" | "UPLOADED" | "FAILED";
            /** Format: date-time */
            captured_at?: string;
        };
        Finding: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            session_id?: string;
            /** Format: uuid */
            item_id?: string | null;
            is_life_safety?: boolean;
            /** @enum {string} */
            severity?: "CRITICAL" | "MAJOR" | "MINOR";
            title?: string;
            description?: string;
            location?: string;
        };
        AuditLog: {
            /** Format: uuid */
            uuid: string;
            actor_email?: string | null;
            action: string;
            entity_type: string;
            /** Format: uuid */
            entity_id: string;
            before?: {
                [key: string]: unknown;
            } | null;
            after?: {
                [key: string]: unknown;
            } | null;
            ip?: string | null;
            /** Format: date-time */
            at?: string | null;
        };
        AuditLogPage: {
            /** @example true */
            success?: boolean;
            data?: components["schemas"]["AuditLog"][];
            meta?: components["schemas"]["PaginationMeta"];
        };
        IngestionBatch: {
            /** Format: uuid */
            id?: string;
            /** @enum {string} */
            source?: "dm_audit_ops" | "CHECKLIST";
            file_key?: string;
            hotel_code?: string;
            year?: number;
            /** @enum {string} */
            status?: "UPLOADED" | "IMPORTED" | "FAILED";
            row_count?: number;
            fail_count?: number;
            /** Format: uuid */
            imported_by?: string;
            /** Format: date-time */
            imported_at?: string | null;
        };
        YoYPoint: {
            year?: number;
            department?: string;
            /** Format: uuid */
            hotel_id?: string;
            /** Format: double */
            score?: number;
        };
        HeatmapPoint: {
            /** Format: uuid */
            hotel_id?: string;
            code?: string;
            name?: string;
            /** Format: double */
            lat?: number;
            /** Format: double */
            lng?: number;
            brand_tier?: string;
            region?: string;
            /** Format: double */
            score?: number | null;
            /** @enum {string|null} */
            risk_level?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
            has_life_safety?: boolean;
            open_capa?: number;
        };
        DashboardOverview: {
            /** Format: date-time */
            as_of?: string;
            hotels_total?: number;
            hotels_with_risk?: number;
            audits_ytd?: number;
            audits_today?: number;
            findings_total?: number;
            life_safety_open?: number;
            capa_active?: number;
            capa_closed?: number;
            /**
             * @example {
             *       "OPEN": 12,
             *       "AWAITING_GM": 5,
             *       "AWAITING_QA": 3,
             *       "CLOSED": 22
             *     }
             */
            pipeline?: {
                [key: string]: number;
            };
            sla?: {
                on_time?: number;
                near_overdue?: number;
                overdue?: number;
                unknown?: number;
            };
            insights?: {
                type?: string;
                count?: number;
                open_capa?: number | null;
                near_overdue?: number | null;
                findings_ls?: number | null;
            }[];
        };
        CapaTicket: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            finding_id?: string | null;
            /** Format: uuid */
            hotel_id?: string;
            /** @enum {integer} */
            priority?: 1 | 2 | 3;
            sla_hours?: number;
            /** Format: date-time */
            due_at?: string;
            /** @enum {string} */
            status?: "OPEN" | "IN_PROGRESS" | "AWAITING_GM" | "AWAITING_QA" | "CLOSED";
            title?: string;
            description?: string;
            /** Format: uuid */
            assigned_to?: string | null;
            /** @default 0 */
            escalation_level: number;
            receipt_id?: string | null;
            origin?: string;
            /** Format: date-time */
            submitted_at?: string | null;
            /** Format: date-time */
            closed_at?: string | null;
            /** Format: uuid */
            closed_by?: string | null;
            sla_status?: string | null;
            overdue?: boolean | null;
        };
        CapaHistory: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            ticket_id?: string;
            from_status?: string;
            to_status?: string;
            /** Format: uuid */
            actor_id?: string;
            note?: string;
            /** Format: date-time */
            at?: string;
        };
        CapaMedia: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            ticket_id?: string;
            /** @enum {string} */
            phase?: "BEFORE" | "AFTER";
            /** @enum {string} */
            source_camera?: "LIVE_CAMERA";
            object_key?: string;
            file_name?: string;
            mime?: string;
            width?: number;
            height?: number;
            size_bytes?: number | null;
            checksum_sha256?: string;
            gps_lat?: number | null;
            gps_lng?: number | null;
            gps_valid?: boolean;
            /** Format: date-time */
            captured_at?: string;
            /** Format: date-time */
            server_captured_at?: string | null;
            /** @enum {string} */
            upload_status?: "PENDING" | "PRESIGNED" | "VERIFIED" | "FAILED";
        };
        CapaMediaStat: {
            count?: number;
            verified?: number;
        };
        Lead: {
            /** Format: uuid */
            id?: string;
            lead_no?: string;
            /** Format: uuid */
            hotel_id?: string;
            /** @enum {string} */
            source?: "RFP_PORTAL" | "CROSS_SELLING" | "REFERRAL" | "MANUAL";
            institution_type?: string;
            company_name?: string;
            pic_name?: string;
            pic_phone?: string;
            pic_email?: string;
            /** Format: uuid */
            province_id?: string | null;
            /** @enum {string} */
            status?: "LEAD" | "CONTACTED" | "PROSPECT" | "CONFIRMED" | "LOST";
            lost_reason?: string | null;
            /** Format: date-time */
            next_followup_at?: string | null;
            /** Format: double */
            amount_est?: number | null;
            /** Format: uuid */
            owner_id?: string;
            /** Format: uuid */
            referred_from_hotel_id?: string | null;
            /** Format: date-time */
            created_at?: string;
            /** Format: date-time */
            updated_at?: string | null;
        };
        /** @description Row kanban CRM War Room (F-07) — field server-side utk kartu */
        LeadKanbanRow: {
            /** Format: uuid */
            id?: string;
            lead_no?: string;
            /** Format: uuid */
            hotel_id?: string;
            /** @enum {string} */
            source?: "RFP_PORTAL" | "CROSS_SELLING" | "REFERRAL" | "MANUAL";
            institution_type?: string;
            company_name?: string;
            pic_name?: string;
            pic_phone?: string;
            pic_email?: string;
            /** Format: uuid */
            province_id?: string | null;
            /** @enum {string} */
            status?: "LEAD" | "CONTACTED" | "PROSPECT" | "CONFIRMED" | "LOST";
            lost_reason?: string | null;
            /** Format: date-time */
            next_followup_at?: string | null;
            /** Format: double */
            amount_est?: number | null;
            /** Format: uuid */
            owner_id?: string;
            /** Format: uuid */
            referred_from_hotel_id?: string | null;
            /** Format: date-time */
            created_at?: string;
            /** Format: date-time */
            updated_at?: string | null;
            followup_due?: boolean;
            hotel_code?: string | null;
            owner_name?: string | null;
        };
        LeadCreateRequest: {
            /** Format: uuid */
            hotel_id: string;
            /** @enum {string} */
            source?: "RFP_PORTAL" | "CROSS_SELLING" | "REFERRAL" | "MANUAL";
            /** @enum {string} */
            institution_type?: "GOV" | "PRIVATE";
            company_name: string;
            pic_name?: string;
            pic_phone?: string;
            /** Format: email */
            pic_email?: string;
            /** Format: uuid */
            province_id?: string;
            /** Format: double */
            amount_est?: number;
            /** Format: date-time */
            next_followup_at?: string;
            /** Format: uuid */
            owner_id?: string;
        };
        LeadUpdateRequest: {
            /** @enum {string} */
            status?: "LEAD" | "CONTACTED" | "PROSPECT" | "CONFIRMED" | "LOST";
            lost_reason?: string | null;
            /** Format: date-time */
            next_followup_at?: string | null;
            /** Format: double */
            amount_est?: number;
            /** Format: uuid */
            owner_id?: string;
            company_name?: string;
            /** @enum {string} */
            institution_type?: "GOV" | "PRIVATE";
            /** @enum {string} */
            source?: "RFP_PORTAL" | "CROSS_SELLING" | "REFERRAL" | "MANUAL";
            /** Format: uuid */
            province_id?: string;
            pic_name?: string;
            pic_phone?: string;
            /** Format: email */
            pic_email?: string;
        };
        LeadActivity: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            lead_id?: string;
            /** @enum {string} */
            type?: "CALL" | "EMAIL" | "MEETING" | "NOTE";
            note?: string;
            /** Format: date-time */
            next_followup_at?: string | null;
            /** Format: uuid */
            actor_id?: string;
            /** Format: date-time */
            at?: string;
        };
        LeadReferral: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            lead_id?: string;
            /** Format: uuid */
            from_hotel_id?: string;
            /** Format: uuid */
            to_hotel_id?: string;
            /** Format: double */
            commission_amount?: number | null;
            status?: string;
            note?: string;
        };
        Quotation: {
            /** Format: uuid */
            id?: string;
            quotation_no?: string;
            /** Format: uuid */
            lead_id?: string;
            /** Format: uuid */
            hotel_id?: string;
            company_name?: string | null;
            lead_no?: string | null;
            institution_type?: string | null;
            hotel_code?: string | null;
            hotel_name?: string | null;
            /** Format: date */
            event_date?: string;
            event_name?: string;
            /** @enum {string} */
            package_type?: "FULLDAY" | "HALFDAY" | "FULLBOARD";
            pax_count?: number;
            /** Format: double */
            sbm_rate_value?: number;
            sbm_fiscal_year?: number;
            /** Format: double */
            gross_amount?: number;
            /** Format: double */
            discount_amount?: number;
            /** Format: double */
            final_amount?: number;
            /** @enum {string} */
            discount_approval_status?: "PENDING" | "APPROVED" | "REJECTED";
            /** @enum {string} */
            status?: "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED";
            /** Format: uuid */
            created_by?: string;
            /** Format: date-time */
            created_at?: string;
        };
        /** @description Server menghitung SBM max per (province × package × fiscal_year), snapshot ke quotation (E3), validasi pagu (F-09). */
        QuotationCreateRequest: {
            /** Format: uuid */
            lead_id: string;
            /** Format: date */
            event_date: string;
            event_name?: string | null;
            /** @enum {string} */
            package_type: "FULLDAY" | "HALFDAY" | "FULLBOARD";
            pax_count: number;
            /** Format: double */
            gross_amount?: number;
            /**
             * Format: double
             * @default 0
             */
            discount_amount: number;
        };
        QuotationUpdateRequest: {
            /** @enum {string} */
            status?: "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED";
            /** @enum {string} */
            discount_approval_status?: "APPROVED" | "REJECTED";
            event_name?: string;
            /** Format: date */
            event_date?: string;
            pax_count?: number;
            /** Format: double */
            gross_amount?: number;
            /** Format: double */
            discount_amount?: number;
            note?: string;
        };
        SbmRate: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            province_id?: string;
            province?: string;
            /** @enum {string} */
            package_type?: "FULLDAY" | "HALFDAY" | "FULLBOARD";
            /**
             * Format: double
             * @example 400000
             */
            max_rate_per_pax?: number;
            /** @example 2026 */
            fiscal_year?: number;
            /** @default true */
            is_active: boolean;
        };
        LostReasonBreakdownRow: {
            reason?: string;
            count?: number;
            /** Format: double */
            lost_amount?: number;
            /**
             * Format: double
             * @description share % dari total LOST (0-100)
             */
            pct?: number;
        };
        LostReasonTrendRow: {
            /** @example 2026-Q3 */
            quarter?: string;
            count?: number;
            /** Format: double */
            lost_amount?: number;
        };
        LostReasonAnalytics: {
            /** @example 2026-10-01..2026-12-31 */
            period?: string | null;
            total_leads?: number;
            total_lost?: number;
            /** Format: double */
            lost_rate?: number | null;
            /** Format: double */
            total_lost_amount?: number;
            breakdown?: components["schemas"]["LostReasonBreakdownRow"][];
            trend?: components["schemas"]["LostReasonTrendRow"][];
        };
        BillingMilestone: {
            /** Format: uuid */
            id?: string;
            /** Format: uuid */
            quotation_id?: string;
            quotation_no?: string | null;
            hotel_name?: string | null;
            hotel_code?: string | null;
            event_name?: string | null;
            /** @enum {string} */
            milestone_type?: "SPK" | "NPWP" | "BAST" | "LPJ";
            doc_no?: string | null;
            doc_key?: string | null;
            doc_url?: string | null;
            /** @enum {string} */
            status?: "EXPECTED" | "UPLOADED" | "PAID" | "OVERDUE";
            /** Format: double */
            amount?: number | null;
            /** Format: date */
            due_date?: string;
            /** Format: date-time */
            paid_at?: string | null;
            /** Format: uuid */
            updated_by?: string | null;
            /** Format: date-time */
            created_at?: string;
            /** Format: date-time */
            updated_at?: string | null;
        };
        BillingMilestoneCreate: {
            /** Format: uuid */
            quotation_id: string;
            /** @enum {string} */
            milestone_type: "SPK" | "NPWP" | "BAST" | "LPJ";
            /** Format: date */
            due_date: string;
            /** Format: double */
            amount?: number | null;
            doc_no?: string | null;
        };
        BillingMilestoneUpdate: {
            /** @enum {string} */
            status?: "EXPECTED" | "UPLOADED" | "PAID" | "OVERDUE";
            doc_key?: string | null;
            doc_no?: string | null;
            /** Format: date-time */
            paid_at?: string | null;
        };
        PublicHotel: {
            code?: string;
            name?: string;
            city?: string;
            brand?: string;
            brand_tier?: string;
            mice_capacity?: {
                ballroom_capacity?: number;
                meeting_rooms?: number;
                has_videotron?: boolean;
            };
        };
        PublicPackage: {
            code?: string;
            name?: string;
            description?: string;
            /** @enum {string} */
            package_type?: "FULLDAY" | "HALFDAY" | "FULLBOARD";
            /** Format: double */
            from_price?: number | null;
        };
        RfpPublicCreate: {
            company_name: string;
            /** @enum {string} */
            institution_type?: "GOV" | "PRIVATE";
            pic_name: string;
            phone: string;
            /** Format: email */
            email?: string;
            /** Format: date */
            event_date: string;
            pax: number;
            /** @enum {string} */
            package_type?: "FULLDAY" | "HALFDAY" | "FULLBOARD";
            city: string;
            target_hotel_code?: string;
            notes?: string;
        };
        TranslationBundle: {
            /** @enum {string} */
            locale?: "id" | "en";
            items?: {
                entity_type?: string;
                /** Format: uuid */
                entity_id?: string;
                field?: string;
                value?: string;
            }[];
            /** Format: date-time */
            updated_after?: string;
        };
        BrandHotelSummary: {
            /** Format: uuid */
            id: string;
            code: string;
            name: string;
            city?: string | null;
            /** @default ACTIVE */
            status: string;
        };
        BrandDetail: {
            /** Format: uuid */
            id: string;
            code: string;
            name: string;
            /** @enum {string} */
            tier: "Luxury" | "Upscale" | "Boutique" | "Midscale" | "Budget" | "Eco-Resort";
            /**
             * @default ACTIVE
             * @enum {string}
             */
            status: "ACTIVE" | "INACTIVE" | "RETIRED";
            /** @default 0 */
            hotels_count: number;
            /** Format: date-time */
            created_at?: string | null;
            /** Format: date-time */
            updated_at?: string | null;
            hotels?: unknown[];
        };
        BrandCreateRequest: {
            code: string;
            name: string;
            /** @enum {string} */
            tier: "Luxury" | "Upscale" | "Boutique" | "Midscale" | "Budget" | "Eco-Resort";
            /**
             * @default ACTIVE
             * @enum {string}
             */
            status: "ACTIVE" | "INACTIVE" | "RETIRED";
        };
        BrandUpdateRequest: {
            code?: string;
            name?: string;
            /** @enum {string} */
            tier?: "Luxury" | "Upscale" | "Boutique" | "Midscale" | "Budget" | "Eco-Resort";
            /** @enum {string} */
            status?: "ACTIVE" | "INACTIVE" | "RETIRED";
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Login berhasil */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginResponse"];
                };
            };
            /** @description Kredensial tidak valid */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
            /** @description Validasi gagal */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiValidationError"];
                };
            };
        };
    };
    refreshToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    refresh_token: string;
                };
            };
        };
        responses: {
            /** @description Token baru */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            access_token?: string;
                            refresh_token?: string;
                        };
                    };
                };
            };
            /** @description Refresh token invalid/expired */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    getMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Profil */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["User"] & {
                            roles?: components["schemas"]["Role"][];
                            active_hotel?: components["schemas"]["Hotel"];
                        };
                    };
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    listMyHotels: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            /** Format: uuid */
                            hotel_id?: string;
                            hotel_code?: string;
                            hotel_name?: string;
                            /** Format: uuid */
                            role_id?: string;
                            role_code?: string;
                            is_primary?: boolean;
                        }[];
                    };
                };
            };
        };
    };
    switchHotel: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    hotel_id: string;
                };
            };
        };
        responses: {
            /** @description Scope diperbarui */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            active_hotel?: components["schemas"]["Hotel"];
                        };
                    };
                };
            };
        };
    };
    setLocale: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * @example en
                     * @enum {string}
                     */
                    locale: "id" | "en";
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            /** @example en */
                            preferred_locale?: string;
                        };
                    };
                };
            };
        };
    };
    listUsers: {
        parameters: {
            query?: {
                role_code?: string;
                hotel_id?: string;
                search?: string;
                page?: number;
                per_page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK (paginated) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["User"][];
                        meta?: components["schemas"]["PaginationMeta"];
                    };
                };
            };
        };
    };
    createUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserCreateRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["User"];
                    };
                };
            };
            /** @description Di luar scope delegasi */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    getUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["User"];
                    };
                };
            };
        };
    };
    deactivateUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Hanya dalam scope; ROOT bisa revoke siapa pun (A4) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    updateUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["User"];
                    };
                };
            };
        };
    };
    resetPassword: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    new_password: string;
                };
            };
        };
        responses: {
            /** @description OK */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    listRoles: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Role"][];
                    };
                };
            };
        };
    };
    setRolePermissions: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    permission_codes: string[];
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["RoleWithPermissions"];
                    };
                };
            };
        };
    };
    listHotels: {
        parameters: {
            query?: {
                brand_tier?: string;
                region_id?: string;
                city?: string;
                status?: "ACTIVE" | "TEMPORARILY_CLOSED" | "TERMINATED";
                has_ballroom?: boolean;
                page?: number;
                per_page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Hotel"][];
                        meta?: components["schemas"]["PaginationMeta"];
                    };
                };
            };
        };
    };
    createHotel: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HotelCreateRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Hotel"];
                    };
                };
            };
            /** @description Kode hotel sudah ada */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    getHotel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Hotel"];
                    };
                };
            };
            /** @description Tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    deleteHotel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            /** Format: uuid */
                            id?: string;
                            code?: string;
                            /** @example true */
                            deleted?: boolean;
                        };
                    };
                };
            };
        };
    };
    updateHotel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HotelUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Hotel"];
                    };
                };
            };
        };
    };
    listHotelDepartments: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: unknown[];
                    };
                };
            };
        };
    };
    listHotelContacts: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["HotelContact"][];
                    };
                };
            };
        };
    };
    createHotelContact: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HotelContactCreateRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["HotelContact"];
                    };
                };
            };
        };
    };
    deleteHotelContact: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
                contactId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: Record<string, never>;
                    };
                };
            };
        };
    };
    updateHotelContact: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
                contactId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HotelContactUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["HotelContact"];
                    };
                };
            };
        };
    };
    listCities: {
        parameters: {
            query?: {
                province_id?: string;
                region_id?: string;
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["City"][];
                    };
                };
            };
        };
    };
    createCity: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CityCreateRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["City"];
                    };
                };
            };
        };
    };
    getCity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["City"];
                    };
                };
            };
        };
    };
    deleteCity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: Record<string, never>;
                    };
                };
            };
        };
    };
    updateCity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cityId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CityUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["City"];
                    };
                };
            };
        };
    };
    listBrands: {
        parameters: {
            query?: {
                search?: string;
                tier?: "Luxury" | "Upscale" | "Boutique" | "Midscale" | "Budget" | "Eco-Resort";
                status?: "ACTIVE" | "INACTIVE" | "RETIRED";
                page?: number;
                per_page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: unknown[];
                        meta?: unknown;
                    };
                };
            };
        };
    };
    createBrand: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description Brand created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        message?: string;
                        data?: unknown;
                    };
                };
            };
            /** @description Forbidden (memerlukan master:write) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kode brand sudah terdaftar */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateBrandTier: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BrandTierUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Brand"];
                    };
                };
            };
            /** @description Brand tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Tier tidak valid */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    listRegions: {
        parameters: {
            query?: {
                search?: string;
                status?: "ACTIVE" | "INACTIVE" | "RETIRED";
                page?: number;
                per_page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Region"][];
                        meta?: components["schemas"]["PaginationMeta"];
                    };
                };
            };
        };
    };
    createRegion: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegionCreateRequest"];
            };
        };
        responses: {
            /** @description Region created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Region"];
                        message?: string;
                    };
                };
            };
            /** @description Forbidden (memerlukan master:write) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Kode wilayah sudah terdaftar */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getRegion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["RegionDetail"];
                    };
                };
            };
            /** @description Region tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deleteRegion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            id?: string;
                            code?: string;
                            deleted?: boolean;
                        };
                        message?: string;
                    };
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Region tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Ditolak karena masih ada hotel aktif terdaftar */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateRegion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegionUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Region"];
                        message?: string;
                    };
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Region tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Konflik kode wilayah */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    listProvinces: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Province"][];
                    };
                };
            };
        };
    };
    listTemplates: {
        parameters: {
            query?: {
                department?: "GM" | "HOUSEKEEPING" | "KITCHEN_FB" | "SECURITY_RISK";
                brand_tier?: string;
                status?: "DRAFT" | "LOCKED" | "ARCHIVED";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["ChecklistTemplate"][];
                    };
                };
            };
        };
    };
    createTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TemplateCreateRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["ChecklistTemplate"];
                    };
                };
            };
        };
    };
    getTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["TemplateDetail"];
                    };
                };
            };
        };
    };
    deleteTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        message?: string;
                    };
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflict (template locked atau terhubung dengan sesi audit) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    createTemplateVersion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @example v2027.1 */
                    new_version: string;
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["ChecklistTemplate"];
                    };
                };
            };
        };
    };
    lockTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK (status=LOCKED) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["ChecklistTemplate"];
                    };
                };
            };
        };
    };
    archiveTemplate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK (status=ARCHIVED) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["ChecklistTemplate"];
                    };
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Conflict (hanya template LOCKED yang dapat diarsipkan) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    createSection: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    code: string;
                    name: string;
                    /** Format: uuid */
                    parent_id?: string | null;
                    /** @default 0 */
                    sort_order?: number;
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["ChecklistSection"];
                    };
                };
            };
        };
    };
    createItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                sectionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ItemCreateRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["ChecklistItem"];
                    };
                };
            };
        };
    };
    updateItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                sectionId: string;
                itemId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ItemUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["ChecklistItem"];
                    };
                };
            };
            /** @description Template bukan DRAFT */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Rubrik tidak valid / section-item asing / minimal satu field */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    listSessions: {
        parameters: {
            query?: {
                hotel_id?: string;
                department?: "GM" | "HOUSEKEEPING" | "KITCHEN_FB" | "SECURITY_RISK";
                status?: "DRAFT" | "IN_PROGRESS" | "SUBMITTED" | "PUBLISHED";
                origin?: "SYSTEM" | "LEGACY";
                date_from?: string;
                date_to?: string;
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["AuditSession"][];
                        meta?: components["schemas"]["PaginationMeta"];
                    };
                };
            };
        };
    };
    createSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AuditSessionCreateRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["AuditSession"];
                    };
                };
            };
        };
    };
    getSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["AuditSession"] & {
                            department_breakdown?: {
                                section_code?: string;
                                section_name?: string;
                                /** Format: double */
                                score?: number | null;
                                /** Format: double */
                                max?: number | null;
                                /** Format: double */
                                pct?: number | null;
                                items_count?: number | null;
                            }[] | null;
                            items?: components["schemas"]["AuditItemScore"][];
                            findings?: (components["schemas"]["Finding"] & {
                                item_code?: string | null;
                            })[];
                        };
                    };
                };
            };
        };
    };
    deleteSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        message?: string;
                    };
                };
            };
            /** @description Sesi bukan DRAFT */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AuditSessionUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["AuditSession"];
                    };
                };
            };
            /** @description Sesi bukan DRAFT */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Parameter tidak valid */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    submitSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["AuditSession"];
                    };
                };
            };
        };
    };
    reopenSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["AuditSession"];
                    };
                };
            };
            /** @description Sesi bukan SUBMITTED */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    publishSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["AuditSession"];
                    };
                };
            };
        };
    };
    bulkUpsertScores: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    scores: components["schemas"]["ScoreUpsert"][];
                };
            };
        };
        responses: {
            /** @description OK (conflict count jika ada) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            upserted?: number;
                            conflicts?: number;
                        };
                    };
                };
            };
        };
    };
    syncPush: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SyncPushRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["SyncPushResult"];
                    };
                };
            };
        };
    };
    syncPull: {
        parameters: {
            query: {
                since: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            scores?: components["schemas"]["AuditItemScore"][];
                            media_status?: components["schemas"]["AuditMedia"][];
                            /** Format: date-time */
                            server_now?: string;
                        };
                    };
                };
            };
        };
    };
    listConflicts: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["SyncConflict"][];
                    };
                };
            };
        };
    };
    resolveConflict: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                conflictId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    winning_value: string;
                    note?: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["SyncConflict"];
                    };
                };
            };
        };
    };
    listMedia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["AuditMedia"][];
                    };
                };
            };
        };
    };
    registerMedia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MediaRegisterRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            /** Format: uuid */
                            media_id?: string;
                            presigned_url?: string;
                            object_key?: string;
                        };
                    };
                };
            };
            /** @description Foto bukan dari live camera / GPS di luar radius (F-04) */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiValidationError"];
                };
            };
        };
    };
    confirmMedia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                mediaId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["AuditMedia"];
                    };
                };
            };
        };
    };
    getSessionReport: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description PDF laporan */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/pdf": string;
                };
            };
        };
    };
    listAuditLogs: {
        parameters: {
            query?: {
                entity_type?: string;
                action?: string;
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Daftar entri audit */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditLogPage"];
                };
            };
            /** @description Tidak terautentikasi */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
            /** @description Tanpa izin (bukan korporat / tanpa `users`) */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    listBatches: {
        parameters: {
            query?: {
                source?: "dm_audit_ops" | "CHECKLIST";
                status?: "UPLOADED" | "IMPORTED" | "FAILED";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["IngestionBatch"][];
                    };
                };
            };
        };
    };
    createBatch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": {
                    /** Format: binary */
                    file: string;
                    /** @enum {string} */
                    source: "dm_audit_ops" | "CHECKLIST";
                    /** @example 2026 */
                    final_year: number;
                };
            };
        };
        responses: {
            /** @description Created (UPLOADED) */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["IngestionBatch"];
                    };
                };
            };
        };
    };
    runBatch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["IngestionBatch"];
                    };
                };
            };
        };
    };
    getBatch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["IngestionBatch"];
                    };
                };
            };
        };
    };
    getYoY: {
        parameters: {
            query?: {
                hotel_id?: string;
                department?: string;
                years?: number[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["YoYPoint"][];
                    };
                };
            };
        };
    };
    getHeatmap: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["HeatmapPoint"][];
                    };
                };
            };
        };
    };
    getRiskIndex: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["HeatmapPoint"][];
                    };
                };
            };
        };
    };
    getHotelDrilldown: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                hotelId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data: {
                            /** Format: uuid */
                            hotel_id?: string;
                            code?: string;
                            name?: string;
                            score_history?: components["schemas"]["YoYPoint"][];
                            open_capa_count?: number;
                            risk_level?: string;
                        };
                    };
                };
            };
        };
    };
    getDashboardOverview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["DashboardOverview"];
                    };
                };
            };
        };
    };
    listTickets: {
        parameters: {
            query?: {
                hotel_id?: string;
                priority?: 1 | 2 | 3;
                status?: "OPEN" | "AWAITING_GM" | "AWAITING_QA" | "CLOSED";
                only_overdue?: boolean;
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["CapaTicket"][];
                        meta?: components["schemas"]["PaginationMeta"];
                    };
                };
            };
        };
    };
    createTicket: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    finding_id?: string | null;
                    /** Format: uuid */
                    hotel_id?: string | null;
                    department?: string | null;
                    /** @enum {integer|null} */
                    priority?: 1 | 2 | 3 | null;
                    title?: string | null;
                    description?: string | null;
                    /** Format: uuid */
                    assigned_to?: string | null;
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["CapaTicket"];
                    };
                };
            };
        };
    };
    getTicket: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["CapaTicket"] & {
                            hotel_code?: string | null;
                            assignee_name?: string | null;
                            sla_status?: string | null;
                            overdue?: boolean;
                            media_summary?: {
                                before?: Record<string, never>;
                                after?: Record<string, never>;
                                has_verified_after?: boolean;
                                ready?: boolean;
                            };
                            media?: components["schemas"]["CapaMedia"][];
                            history?: components["schemas"]["CapaHistory"][];
                        };
                    };
                };
            };
        };
    };
    updateTicket: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    title?: string | null;
                    description?: string | null;
                    /** @enum {integer|null} */
                    priority?: 1 | 2 | 3 | null;
                    /** Format: uuid */
                    assigned_to?: string | null;
                    /** Format: date-time */
                    due_at?: string | null;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["CapaTicket"];
                    };
                };
            };
        };
    };
    assignTicket: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    assigned_to: string;
                    note?: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["CapaTicket"];
                    };
                };
            };
        };
    };
    resolveTicket: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    note: string;
                    media?: components["schemas"]["MediaRegisterRequest"][];
                };
            };
        };
        responses: {
            /** @description OK (status → AWAITING_GM — Four-Eyes) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["CapaTicket"];
                    };
                };
            };
        };
    };
    verifyGm: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    decision: "APPROVE" | "REJECT";
                    note?: string;
                };
            };
        };
        responses: {
            /** @description OK (APPROVE → AWAITING_QA) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["CapaTicket"];
                    };
                };
            };
        };
    };
    verifyQa: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    decision: "CLOSE" | "REOPEN";
                    note?: string;
                };
            };
        };
        responses: {
            /** @description OK (CLOSE → CLOSED) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["CapaTicket"];
                    };
                };
            };
        };
    };
    escalateTicket: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["CapaTicket"];
                    };
                };
            };
        };
    };
    ticketHistory: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["CapaHistory"][];
                    };
                };
            };
        };
    };
    listTicketMedia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            items?: components["schemas"]["CapaMedia"][];
                            summary?: {
                                before?: components["schemas"]["CapaMediaStat"];
                                after?: components["schemas"]["CapaMediaStat"];
                                has_verified_after?: boolean;
                                ready?: boolean;
                            };
                        };
                    };
                };
            };
        };
    };
    presignGetTicketMedia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                media_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            /** Format: uuid */
                            media_id?: string;
                            object_key?: string;
                            presigned_url?: string;
                            /** @example 300 */
                            expires_in?: number;
                        };
                    };
                };
            };
            /** @description Media belum VERIFIED / bukan milik ticket */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success?: boolean;
                        message?: string;
                    };
                };
            };
        };
    };
    presignTicketMedia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                media_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            /** Format: uuid */
                            media_id?: string;
                            object_key?: string;
                            presigned_url?: string;
                            upload_status?: string;
                            /** @example 420 */
                            expires_in?: number;
                        };
                    };
                };
            };
            /** @description Media sudah VERIFIED / transisi invalid */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example false */
                        success?: boolean;
                        message?: string;
                    };
                };
            };
        };
    };
    confirmTicketMedia: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
                media_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    /** @description Guard path: wajib sama dgn object_key tersimpan */
                    object_key?: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["CapaMedia"];
                    };
                };
            };
            /** @description object_key tidak cocok */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Object store tidak terjangkau (error jujur, G4) */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    listLeads: {
        parameters: {
            query?: {
                status?: "LEAD" | "CONTACTED" | "PROSPECT" | "CONFIRMED" | "LOST";
                source?: string;
                owner_id?: string;
                followup_due?: boolean;
                hotel_id?: string;
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["LeadKanbanRow"][];
                        meta?: components["schemas"]["PaginationMeta"];
                    };
                };
            };
        };
    };
    createLead: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LeadCreateRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Lead"];
                    };
                };
            };
        };
    };
    getLead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Lead"] & {
                            activities?: components["schemas"]["LeadActivity"][];
                            quotations?: components["schemas"]["Quotation"][];
                        };
                    };
                };
            };
        };
    };
    updateLead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LeadUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Lead"];
                    };
                };
            };
            /** @description lost_reason kosong saat LOST */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiValidationError"];
                };
            };
        };
    };
    addLeadActivity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    type: "CALL" | "EMAIL" | "MEETING" | "NOTE";
                    note: string;
                    /** Format: date-time */
                    next_followup_at?: string | null;
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["LeadActivity"];
                    };
                };
            };
        };
    };
    referLead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    to_hotel_id: string;
                    /** Format: double */
                    commission_amount?: number | null;
                    note?: string;
                };
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["LeadReferral"];
                    };
                };
            };
        };
    };
    listQuotations: {
        parameters: {
            query?: {
                lead_id?: string;
                status?: "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED";
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Quotation"][];
                        meta?: components["schemas"]["PaginationMeta"];
                    };
                };
            };
        };
    };
    createQuotation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuotationCreateRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Quotation"];
                    };
                };
            };
            /** @description Rate SBM melebihi pagu provinsi/tahun */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    getQuotation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Quotation"] & {
                            milestones?: components["schemas"]["BillingMilestone"][];
                            pdf_url?: string;
                        };
                    };
                };
            };
        };
    };
    updateQuotation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuotationUpdateRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["Quotation"];
                    };
                };
            };
            /** @description Transisi status ilegal atau diskon butuh approval GM */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiErrorResponse"];
                };
            };
        };
    };
    generateQuotationPdf: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK (pdf_url dikembalikan) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            pdf_url?: string;
                        };
                    };
                };
            };
        };
    };
    listSbmRates: {
        parameters: {
            query?: {
                province_id?: string;
                package_type?: "FULLDAY" | "HALFDAY" | "FULLBOARD";
                fiscal_year?: number;
                is_active?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["SbmRate"][];
                    };
                };
            };
        };
    };
    updateSbmRate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /**
                     * Format: double
                     * @example 450000
                     */
                    max_rate_per_pax?: number;
                    fiscal_year?: number;
                    is_active?: boolean;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["SbmRate"];
                    };
                };
            };
        };
    };
    getLostReasonAnalytics: {
        parameters: {
            query?: {
                /** @description Awal periode (inklusif). Default = awal kuartal berjalan. */
                from?: string;
                /** @description Akhir periode (inklusif). Default = hari ini. */
                to?: string;
                hotel_id?: string;
                region_id?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["LostReasonAnalytics"];
                    };
                };
            };
            /** @description Missing permission crm:read / scope hotel/region/global */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Region tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    listMilestones: {
        parameters: {
            query?: {
                quotation_id?: string;
                status?: "EXPECTED" | "UPLOADED" | "PAID" | "OVERDUE";
                due_before?: string;
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["BillingMilestone"][];
                        meta?: components["schemas"]["PaginationMeta"];
                    };
                };
            };
            /** @description Missing permission crm:read / scope hotel/region/global */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description status tidak dikenal */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    createMilestone: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BillingMilestoneCreate"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["BillingMilestone"];
                    };
                };
            };
            /** @description Missing permission billing:manage / scope hotel/region/global */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Quotation tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Milestone hanya utk quotation ACCEPTED / milestone sudah ada */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description milestone_type/status/due_date tidak valid */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getMilestone: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["BillingMilestone"];
                    };
                };
            };
            /** @description Missing permission crm:read / scope hotel/region/global */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Milestone/quotation tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateMilestone: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BillingMilestoneUpdate"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["BillingMilestone"];
                    };
                };
            };
            /** @description Missing permission billing:manage / scope hotel/region/global */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Milestone/quotation tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Transisi ilegal (PAID terminal) */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description status tidak dikenal / UPLOADED tanpa doc_key */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    publicCatalog: {
        parameters: {
            query?: {
                brand?: string;
                city?: string;
                max_pax?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK (data publik — tanpa data internal) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["PublicHotel"][];
                        meta?: components["schemas"]["PaginationMeta"];
                    };
                };
            };
        };
    };
    publicPackages: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["PublicPackage"][];
                    };
                };
            };
        };
    };
    publicRfp: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RfpPublicCreate"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            ref_no?: string;
                            /** @example NEW */
                            status?: string;
                        };
                    };
                };
            };
            /** @description Validasi gagal */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ApiValidationError"];
                };
            };
        };
    };
    getTranslations: {
        parameters: {
            query: {
                locale: "id" | "en";
                entity_type?: string;
                since?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: components["schemas"]["TranslationBundle"];
                    };
                };
            };
        };
    };
    putTranslations: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    locale: "id" | "en";
                    items: {
                        entity_type: string;
                        /** Format: uuid */
                        entity_id: string;
                        field: string;
                        value: string;
                    }[];
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            upserted?: number;
                        };
                    };
                };
            };
        };
    };
    listNotifications: {
        parameters: {
            query?: {
                unread_only?: boolean;
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            /** Format: uuid */
                            id?: string;
                            type?: string;
                            title?: string;
                            body?: string;
                            /** Format: date-time */
                            read_at?: string | null;
                            /** Format: date-time */
                            created_at?: string;
                        }[];
                        meta?: components["schemas"]["PaginationMeta"];
                    };
                };
            };
        };
    };
    markNotificationRead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    runBillingReminder: {
        parameters: {
            query?: {
                days_before?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: {
                            /** @example 3 */
                            milestones_reminded?: number;
                            /** @example 12 */
                            notifications_created?: number;
                        };
                    };
                };
            };
            /** @description Missing or invalid token */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getBrand: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: unknown;
                    };
                };
            };
            /** @description Brand tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateBrand: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        message?: string;
                        data?: unknown;
                    };
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Brand tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Konflik kode brand */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    deleteBrand: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        message?: string;
                        data?: Record<string, never> | null;
                    };
                };
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Brand tidak ditemukan */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Ditolak karena masih ada hotel aktif terdaftar */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateBrandTierDirect: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": unknown;
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example true */
                        success?: boolean;
                        data?: unknown;
                    };
                };
            };
        };
    };
}
