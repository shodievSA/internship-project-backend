export interface Contact{ 
    email : string; 
    fullName : string; 
    avatarUrl : string | null; 
}

export interface GooglePerson { 
    emailAddresses: {value: string} [], 
    names: {displayName: string} [], 
    photos? : {url: string}[],
}