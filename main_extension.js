const my_extension = (() => {
    // TODO: remove this function
    async function testMyExtension() {
        const context = await common.getContext();
        console.log("🚀 ~ testMyExtension ~ context:", context)
        // utils.setFieldValue('#info', `User: ${context.user} :: ${context.account} :: ${context.company}`);
    }

    async function startExtension() {
        try {
            const context = await common.getContext();
            const serviceCallId = context.viewState.selectedServiceCallId;
            const serviceCallType = await common.fetchServiceCallType(serviceCallId);       
            if (serviceCallType[0].typeCode !== '-7') {
                utils.setFieldValue('#info', 'Toto SV nie je typu Obhliadka a teda neobsahuje žiadne dáta na zobrazenie.');
            } else {
                // run the extension
                const generalData = await common.fetchGeneralData(serviceCallId);
                console.log("🚀 ~ startExtension ~ generalData:", generalData);

                const skenData = await common.fetchSkenData(serviceCallId);
                console.log("🚀 ~ startExtension ~ skenData:", skenData);

                const deviceData = await common.fetchDeviceData(serviceCallId);
                console.log("🚀 ~ startExtension ~ deviceData:", deviceData);

                if (generalData) {
                    utils.fillStaticData(generalData[0], ['sluzba_internet', 'sluzba_internettv', 'bod_final', 'uspesna', 'narocnost', 'dovod_neuspech' ])
                }
                if (skenData) {
                    utils.createTableBody('#sken_table', ['bod', 'kapacita', 'ssid', 'frekvencia', 'vzdialenost', 'vysledok', 'datum'], skenData);
                }
            }
        } catch (error) {
            console.log("🚀 ~ startExtension ~ error:", error)
            utils.setFieldValue('#error', error);
        }
    }

    return {
        testMyExtension,
        startExtension
    }
})();