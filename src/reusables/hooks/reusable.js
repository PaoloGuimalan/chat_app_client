function importData(resolve, rawresolve) {
    let input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = "image/*"; /** "image/x-png, image/gif, image/jpeg" */
    input.onchange = () => {
        let files = Array.from(input.files);
        files.map((flmp) => {
            getBase64(flmp, resolve);
            rawresolve(flmp)
        });
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

function makeid(length) {
    var result           = '';
    var characters       = '0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function isUserOnline(state, userID){
    const filteractiveusers = state.filter((flt) => flt.sessionStatus == true);
    const activeusersmapper = filteractiveusers.map((mp) => mp._id);
    if(activeusersmapper.includes(userID)){
        return true;
    }
    else{
        return false;
    }
}

export {
    importData,
    getBase64,
    makeid,
    isUserOnline
}