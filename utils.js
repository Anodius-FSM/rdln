const utils = (() => {

    const COLOR_MAP = new Map([
        ['PREBIEHA', '#FFFF00' ],
        ['KONTROLA', '#FFFF00'],
        ['ZAPARKOVANE', '#FFA500'],
        ['ZRIADITELNA', '#008000'],
        ['ZMENA_SLUZBY ', '#008000'],
        ['NEZRIADITELNA', '#FF0000'] 
    ]);
    /**
     * 
     * @param {string} id: DOM elements id 
     * @param {string} value: value of the selected element  
     */
    function setFieldValue(id, value) {
        getDomElement(id).textContent = value;
    }
    /**
     * 
     * @param {string} id: DOM elements id 
     */
    function getDomElement(id) {
        return document.querySelector(id);
    }
    function setBackgroundColor(selector, color) {
        getDomElement(selector).style.backgroundColor = color;
    }
    /**
     * 
     * @param {[string]} imgId 
     */
    function setUpModal(imgId) {
        // let img = getDomElement(imgId);
        imgId.forEach(iId => {
            getDomElement(iId).onclick = (e) => {
                let modal = getDomElement('#myModal');
                // insert the image to the modal
                let modalImg = getDomElement('#img01');
                let captionText = getDomElement('#caption')
                
                modal.style.display = 'block';
                modalImg.src = e.srcElement.currentSrc;
                captionText.innerHTML = e.srcElement.alt;
            }
        });

        // close the modal
        getDomElement('.close').onclick = () => {
            getDomElement('#myModal').style.display = 'none';
        }
    }

    function createTableBody(tableId, headerArray, data) {
        let table = getDomElement(tableId);

        data.forEach(d => {
            let row = table.insertRow(-1); // add a row at the end of the table
            headerArray.forEach((head, i ) => {
                let cell = row.insertCell(i);
                cell.innerText = d[head]; 
            });
        });
    }

    function fillStaticData(inputData, toIgnore) {
        const inputKeys = Object.keys(inputData);
        const dataKeys = inputKeys.filter(k => !toIgnore.includes(k));

        

        dataKeys.forEach(key => {
            if ( key === 'datum_vytvorenia') {
                getDomElement(`#${key}`).innerHTML = inputData[key].split('T')[0] || 'error';
            } if (key === 'stav') {
                setBackgroundColor(`.${key}`, COLOR_MAP.get(key));
                getDomElement(`#${key}`).innerHTML = inputData[key] || 'error';
            } 
            else {
                getDomElement(`#${key}`).innerHTML = inputData[key] || 'error';
            }
        });
    }

    function initSelectOptions(domId, data ) {

    }

    return {
        setFieldValue,
        setUpModal,
        createTableBody,
        fillStaticData,
        initSelectOptions
    }
})();