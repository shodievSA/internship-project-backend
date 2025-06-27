export interface Contact{ 
    email : string; 
    fullName : string; 
    avatarUrl : string; 
}

export interface GooglePerson { 
    emailAddresses: {value: string} [], 
    names: {displayName: string} [], 
    photos? : {url: string}[],
}