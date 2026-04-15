import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Returns the current user's membership status.
 * isMember is true when the membership row exists, is_active=true,
 * and either expires_at is null (lifetime) or in the future.
 */
export function useMembership() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["membership", user?.email],
    queryFn: () => base44.entities.Membership.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const membership = rows[0] || null;
  const isMember =
    !!membership?.is_active &&
    (!membership.expires_at || new Date(membership.expires_at) > new Date());

  return { isMember, isLoading, membership, user };
}
