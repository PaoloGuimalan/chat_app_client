function importData(resolve) {
    let input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = "image/*"; /** "image/x-png, image/gif, image/jpeg" */
    input.onchange = () => {
        let files = Array.from(input.files);
        files.map((flmp) => getBase64(flmp, resolve));
    };
    input.click();
}

function getBase64(file, resolve) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        resolve(reader.result)
    };

    return reader;
}

export {
    importData,
    getBase64
}