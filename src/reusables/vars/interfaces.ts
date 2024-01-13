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