"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { UserInfo } from "@/components/user-info";

const ClientPage = () => {
    const user =  useCurrentUser();

    return (
       <UserInfo 
        label="📱Client compoinent"
        user={user}
        />
    );
};

export default ClientPage;