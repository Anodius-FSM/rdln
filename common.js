const common = (() => {
    const CLIENT_ID = 'MyExtension';
    const CLIENT_VERSION = '1.0.0'

    const { SHELL_EVENTS } = FSMShell;

    let _shellSdk = null;
    let _context = null;
    let _context_valid_until = null;


    function setShellSdk(shellSdk) {
        _shellSdk = shellSdk;
    }

    function getShellSdk() {
        if (!_shellSdk) {
            throw new Error('SHELL_SDK has not been set!');
        }
        return _shellSdk;
    }

    function getContext() {
        const { SHELL_EVENTS } = FSMShell;

        if (_context && Date.now() < _context_valid_until) {
            return Promise.resolve(_context);
        }

        console.log('🚀 ~ common.js ~ 🚀  Requesting context...');

        return new Promise((resolve) => {
            _shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, {
                clientIdentifier: CLIENT_ID,
                auth: {
                    response_type: 'token'
                }
            });

            _shellSdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, (event) => {
                console.log('🚀 ~ common.js ~ 🚀  Context received...');
                _context = JSON.parse(event);
                _context_valid_until = Date.now() + _context.auth.expires_in * 1000 - 3000;
                resolve(_context);
            });
        });
    }

    async function getHeaders() {
        const context = await common.getContext();
        return {
            'Accept': 'application/json',
            'Authorization': `Bearer ${context.auth.access_token}`,
            'Content-Type': 'application/json',
            'X-Client-ID': CLIENT_ID,
            'X-Client-Version': CLIENT_VERSION
        };
    }

    async function getSearchParams() {
        const context = await common.getContext();
        return {
            account: context.account,
            company: context.company
        };
    }
    /**
     * 
     * @param {string} [udoMetaName] 
     * @returns {Promise<{id:string, udoId: string, name: string, description:string}[]>}
     */
    async function fetchUdfMeta(udoMetaName) {
        const response = await fetch(
            'https://eu.fsm.cloud.sap/api/query/v1?' + new URLSearchParams({
                ...await common.getSearchParams(),
                dtos: 'UdfMeta.19;UdoMeta.9'
            }), {
            method: 'POST',
            headers: await common.getHeaders(),
            body: JSON.stringify({
                query:
                    `SELECT
                        udf_meta.id AS id,
                        udf_meta.description AS description,
                        udf_meta.name AS name,
                        udo_meta.id AS udoId
                        FROM UdoMeta udo_meta
                        JOIN UdfMeta udf_meta
                        ON udf_meta.id IN udo_meta.udfMetas
                        WHERE udo_meta.name = '${udoMetaName}'`
            })
        });

        if (!response.ok) {
            throw new Error(`🚀🚀🚀 Failed to fetch UdfMeta, got status ${response.status} `);
        }

        return (await response.json()).data;
    }

    /**
     * @param {string[]} [fieldNames]
     * @returns {Promise<{ id: string, name: string, description: string }[]>}
    */
    async function fetchUdfMetaByFieldName(fieldNames) {
        const response = await fetch(
            'https://eu.fsm.cloud.sap/api/query/v1?' + new URLSearchParams({
                ...await common.getSearchParams(),
                dtos: 'UdfMeta.19',
            }), {
            method: 'POST',
            headers: await common.getHeaders(),
            body: JSON.stringify({
                query:
                    `SELECT
                        udf_meta.id AS id,
                        udf_meta.description AS description,
                        udf_meta.name AS name
                    FROM UdfMeta udf_meta
                    WHERE udf_meta.name IN ('${fieldNames.join('\',\'')}')`
            })
        });

        if (!response.ok) {
            throw new Error(`🚀🚀🚀 Failed to fetch UdfMeta, got status ${response.status}`);
        }

        return (await response.json()).data;
    }

    async function fetchServiceCallType(serviceCallId) {
        const response = await fetch(
            'https://eu.fsm.cloud.sap/api/query/v1?' + new URLSearchParams({
                ...await common.getSearchParams(),
                dtos: 'ServiceCall.27'
            }), {
            method: 'POST',
            headers: await common.getHeaders(),
            body: JSON.stringify({
                query:
                    `SELECT sc.typeCode AS typeCode FROM ServiceCall sc
                            WHERE sc.id = '${serviceCallId}'`
            })
        }
        );

        if (!response.ok) {
            console.log("🚀 ~ fetchServiceCallType ~ response:", response);
            throw new Error(`🚀🚀🚀 Failed to fetch Service Call type, got status ${response.status}`);
        }

        return (await response.json()).data;
    }

    async function fetchGeneralData(serviceCallId) {
        const response = await fetch(
            'https://eu.fsm.cloud.sap/api/query/v1?' + new URLSearchParams({
                ...await common.getSearchParams(),
                dtos: 'ServiceCall.27;Activity.43;Address.22;BusinessPartner.25;UnifiedPerson.13;UdoValue.10'
            }), {
            method: 'POST',
            headers: await common.getHeaders(),
            body: JSON.stringify({
                query:
                    `SELECT uv.udf.z_f_obh_pristupbod AS bod,
                        uv.udf.z_f_obh_pristupbodfinal AS bod_final,
                        uv.udf.z_f_obh_pristupbodfinal AS bod_final,
                        uv.udf.z_f_obh_uspech AS uspesna,
                        uv.udf.z_f_obh_maxrychlost AS max_rychlost,
                        uv.udf.z_f_obh_techinstall AS install_technik,
                        uv.udf.z_f_obh_dovodneuspech AS dovod_neuspech,
                        uv.udf.z_f_obh_narocnost AS narocnost,
                        uv.udf.z_f_obh_pocettech AS pocet_technikov,
                        uv.udf.z_f_obh_casinstall AS cas_install,
                        uv.udf.z_f_obh_rebrik AS rebrik,
                        uv.udf.z_f_obh_internet AS sluzba_internet,
                        uv.udf.z_f_obh_internettv AS sluzba_internettv,
                        uv.udf.z_f_obh_poznamkatech AS poznamka_technika,
                        uv.udf.z_f_obh_poznamkakontr AS poznamka_kontrolora,
                        sc.udf.z_f_sc_obhliadkastav AS stav,
                        sc.createDateTime AS datum_vytvorenia,
                        up.firstName + ' ' + up.lastName AS technik,
                        ad.street AS ulica,
                        ad.streetNo AS cislo_domu,
                        ad.city AS mesto,
                        ad.zipCode AS psc,
                        bp.name AS meno_partnera
                    FROM UdoValue uv
                        JOIN Activity ac ON ac.id = uv.udf.z_f_obh_activity
                        JOIN ServiceCall sc ON sc.id = ac.object.objectId
                        JOIN Address ad ON ac.address = ad.id
                        JOIN BusinessPartner bp ON ac.businessPartner = bp.id
                        JOIN UnifiedPerson up ON up.id IN ac.responsibles
                    WHERE sc.id = '${serviceCallId}'`
            })
        }
        );
        if (!response.ok) {
            console.log("🚀 ~ fetchGeneralData ~ response:", response);
            throw new Error(`🚀🚀🚀 Failed to fetch general data, got status ${response.status}`);
        }
        return (await response.json()).data;
    }

    async function fetchSkenData(serviceCallId) {
        const response = await fetch(
            'https://eu.fsm.cloud.sap/api/query/v1?' + new URLSearchParams({
                ...await common.getSearchParams(),
                dtos: 'ServiceCall.27;Activity.43;UdoValue.10'
            }), {
            method: 'POST',
            headers: await common.getHeaders(),
            body: JSON.stringify({
                query:
                    `SELECT uv.udf.z_f_obs_bod AS bod,
                        uv.udf.z_f_obs_kapacita AS kapacita,
                        uv.udf.z_f_obs_ssid AS ssid,
                        uv.udf.z_f_obs_frekvencia AS frekvencia,
                        uv.udf.z_f_obs_vzdialenost AS vzdialenost,
                        uv.udf.z_f_obs_vysledok AS vysledok,
                        uv.udf.z_f_obs_datum AS datum
                    FROM UdoValue uv
                        JOIN Activity ac ON ac.id = uv.udf.z_f_obs_activity
                        JOIN ServiceCall sc ON sc.id = ac.object.objectId
                    WHERE sc.id = '${serviceCallId}'`
            })
        }
        );
        if (!response.ok) {
            console.log("🚀 ~ fetchSkenData ~ response:", response);
            throw new Error(`🚀🚀🚀 Failed to fetch sken data, got status ${response.status}`);
        }
        return (await response.json()).data;
    }

    async function fetchDeviceData(serviceCallId) {
        const response = await fetch(
            'https://eu.fsm.cloud.sap/api/query/v1?' + new URLSearchParams({
                ...await common.getSearchParams(),
                dtos: 'ServiceCall.27;Activity.43;UdoValue.10'
            }), {
            method: 'POST',
            headers: await common.getHeaders(),
            body: JSON.stringify({
                query:
                    `SELECT uv.udf.z_f_obz_typ AS typ,
                            uv.udf.z_f_obz_model AS model,
                            uv.udf.z_f_obz_ine AS ine
                        FROM UdoValue uv
                            JOIN Activity ac ON ac.id = uv.udf.z_f_obz_activity
                            JOIN ServiceCall sc ON sc.id = ac.object.objectId
                        WHERE sc.id = '${serviceCallId}'`
            })
        }
        );
        if (!response.ok) {
            console.log("🚀 ~ fetchDeviceData ~ response:", response);
            throw new Error(`🚀🚀🚀 Failed to fetch device data, got status ${response.status}`);
        }
        return (await response.json()).data;
    }

    return {
        setShellSdk,
        getShellSdk,
        getContext,
        getHeaders,
        getSearchParams,
        fetchUdfMeta,
        fetchUdfMetaByFieldName,
        fetchServiceCallType,
        fetchGeneralData,
        fetchSkenData,
        fetchDeviceData
    }

})();