"use client";

import { getApiBaseUrl } from "@/lib/api";

export async function performLogout() {
  const token = localStorage.getItem("goalio_token");

  try {
    if (token) {
      await fetch(`${getApiBaseUrl()}/users/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error("Logout istegi tamamlanamadi:", error);
  } finally {
    localStorage.removeItem("goalio_token");
    localStorage.removeItem("goalio_user");
    sessionStorage.clear();
  }
}
