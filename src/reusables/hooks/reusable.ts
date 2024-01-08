function importData(resolve: any, rawresolve: any) {
    let input: any = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = "image/*"; /** "image/x-png, image/gif, image/jpeg" */
    input.onchange = () => {
        let files = Array.from(input.files);
        files.map((flmp: any) => {
            getBase64(flmp, "default", "image", resolve);
            rawresolve(flmp)
        });
    };
    input.click();
}

function importNonImageData(resolve: any, rawresolve: any) {
    let input: any = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    // input.accept = "image/*"; /** "image/x-png, image/gif, image/jpeg" */
    input.onchange = () => {
        let files = Array.from(input.files);
        files.map((flmp: any) => {
            if(Math.round(+flmp.size/1024)/1000 > 25){
                resolve(false);
                rawresolve(false);
            }
            else{
                // console.log(flmp.name)
                getBase64(flmp, flmp.name, flmp.type, resolve);
                rawresolve({
                    name: flmp.name,
                    type: flmp.type,
                    data: flmp
                })
            }
        });
    };
    input.click();
}

function getBase64(file: any, name: string, type: string, resolve: any) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        resolve({
            name: name,
            type: type,
            data: reader.result
        })
    };

    return reader;
}

function makeid(length: number) {
    var result           = '';
    var characters       = '0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

function isUserOnline(state: any, userID: string){
    const filteractiveusers = state.filter((flt: any) => flt.sessionStatus == true);
    const activeusersmapper = filteractiveusers.map((mp: any) => mp._id);
    if(activeusersmapper.includes(userID)){
        return true;
    }
    else{
        return false;
    }
}

export {
    importData,
    importNonImageData,
    getBase64,
    makeid,
    isUserOnline
}