import { CreateUserPrams, SignInParams } from "@/type";
import { Account, Avatars, Client, Databases, ID, Storage } from "react-native-appwrite";

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    platform: "com.webjkhaled.food-project",
    databaseId: '686f0aff0005819e5cb3',
    bucketId: '68643e170015edaa95d7',
    userCollectionId: '686f0b680039886fe20f',
    categoriesCollectionId: '68643a390017b239fa0f',
    menuCollectionId: '68643ad80027ddb96920',
    customizationsCollectionId: '68643c0300297e5abc95',
    menuCustomizationsCollectionId: '68643cd8003580ecdd8f' 
}
export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint!)
    .setProject(appwriteConfig.projectId!)
    .setPlatform(appwriteConfig.platform!)

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars = new Avatars(client);

export const createUser = async ({ email, password, name }: CreateUserPrams) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, name)
        if (!newAccount) throw new Error("Account creation failed.");


        await signIn({ email, password });

        const avatarUrl = `${appwriteConfig.endpoint}/v1/avatars/initials?name=${encodeURIComponent(name)}&project=${appwriteConfig.projectId}`;


          console.log("Avatar URL:", avatarUrl);
          console.log("Avatar URL length:", avatarUrl.length);

        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            { email, name, account: newAccount.$id, avatar: avatarUrl }
            );
    } catch (e) {
        throw new Error(e as string);
    }
}

export const signIn = async ({ email, password }: SignInParams) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);
    } catch (e) {
        throw new Error(e as string);
    }
}