import prisma from "../prisma";

interface IdentifyResponse {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
}

export const identifyContact = async (
    email?: string,
    phoneNumber?: string
): Promise<IdentifyResponse> => {

    if (!email && !phoneNumber) {
        throw new Error("Either email or phoneNumber must be provided");
    }

    // 1️⃣ Find matching contacts
    const matchingContacts = await prisma.contact.findMany({
        where: {
            OR: [
                { email: email ?? undefined },
                { phoneNumber: phoneNumber ?? undefined }
            ]

        }
    });

    // 2️⃣ If no contacts exist → create primary
    if (matchingContacts.length === 0) {
        const newContact = await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkPrecedence: "primary"
            }
        });

        return {
            primaryContactId: newContact.id,
            emails: newContact.email ? [newContact.email] : [],
            phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
            secondaryContactIds: []
        };
    }
    // Step 2: Get root primary IDs
    const rootIds = new Set<number>();

    matchingContacts.forEach(contact => {
        if (contact.linkPrecedence === "primary") {
            rootIds.add(contact.id);
        } else if (contact.linkedId) {
            rootIds.add(contact.linkedId);
        }
    });

    // Step 3: Fetch all contacts under these roots
    const relatedContacts = await prisma.contact.findMany({
        where: {
            OR: [
                { id: { in: Array.from(rootIds) } },
                { linkedId: { in: Array.from(rootIds) } }
            ]
        },
        orderBy: { createdAt: "asc" }
    });

    // Step 4: Find true primary (oldest primary)
    let truePrimary = relatedContacts.find(
        c => c.linkPrecedence === "primary"
    );

    if (!truePrimary) {
        throw new Error("Primary contact not found");
    }
    const otherPrimaries = relatedContacts.filter(
        c => c.linkPrecedence === "primary" && c.id !== truePrimary!.id
    );

    for (const primary of otherPrimaries) {
        await prisma.contact.update({
            where: { id: primary.id },
            data: {
                linkPrecedence: "secondary",
                linkedId: truePrimary!.id
            }
        });
    }
    const allEmails = new Set(relatedContacts.map(c => c.email).filter(Boolean));
    const allPhones = new Set(relatedContacts.map(c => c.phoneNumber).filter(Boolean));

    const isNewEmail = email && !allEmails.has(email);
    const isNewPhone = phoneNumber && !allPhones.has(phoneNumber);

    if (isNewEmail || isNewPhone) {
        await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkPrecedence: "secondary",
                linkedId: truePrimary.id
            }
        });
    }
    const finalContacts = await prisma.contact.findMany({
        where: {
            OR: [
                { id: truePrimary.id },
                { linkedId: truePrimary.id }
            ]
        },
        orderBy: { createdAt: "asc" }
    });
    const emails = Array.from(
        new Set(
            finalContacts
                .map(c => c.email)
                .filter((email): email is string => email !== null)
        )
    );


    const phoneNumbers = Array.from(
        new Set(
            finalContacts
                .map(c => c.phoneNumber)
                .filter((phone): phone is string => phone !== null)
        )
    );


    const secondaryContactIds = finalContacts
        .filter(c => c.linkPrecedence === "secondary")
        .map(c => c.id);

    return {
        primaryContactId: truePrimary.id,
        emails,
        phoneNumbers,
        secondaryContactIds
    };


};
