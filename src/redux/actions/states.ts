export const authenticationstate = {
    auth: null,
    user: {
        userID: "",
        fullName: {
            firstName: "",
            middleName: "",
            lastName: ""
        },
        email: "",
        isActivated: null,
        isVerified: null
    }
}

export const conversationsetupstate = {
    conversationid: null,
    userdetails:{
        userID: "",
        fullname:{
            firstName: "",
            middleName: "",
            lastName: ""
        },
        profile: ""
    },
    groupdetails:{
        groupName: "",
        receivers: [],
        profile: ""
    },
    type: ""
}

export const screensizelistenerstate = {
    W: window.innerWidth,
    H: window.innerHeight
}