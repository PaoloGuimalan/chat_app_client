export interface AuthenticationInterface{
    auth: boolean | null,
    user: {
        userID: string,
        fullName: {
            firstName: string,
            middleName: string,
            lastName: string
        },
        email: string,
        isActivated: boolean | null,
        isVerified: boolean | null,
        profile: string,
        coverphoto: string,
    }
}

export interface ProfileUserInfoInterface{
    userID: string,
    fullname: {
        firstName: string,
        middleName: string,
        lastName: string
    },
    birthdate: {
        month: string,
        day: string,
        year: string
    },
    profile: string,
    gender: string,
    email: string,
    dateCreated: {
        date: string,
        time: string
    },
    isActivated: boolean,
    isVerified: boolean
}

export interface ProfilePostState{
    posts: any[],
    totalposts: number
}