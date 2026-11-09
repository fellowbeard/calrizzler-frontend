import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api.js";

export default function MyProfile({ currentUser, setCurrentUser }) {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    let active = true;

    apiFetch("/api/v1/me")
      .then((user) => {
        if (!active) return;

        setProfile({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          phone: user.phone || "",
          bio: user.bio || "",
        });
        setAvatarUrl(user.avatar_url || null);
      })
      .catch((error) => {
        if (active) setProfileError(error.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfile((previous) => ({ ...previous, [name]: value }));
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswords((previous) => ({ ...previous, [name]: value }));
  }

  async function handleProfileSave(event) {
    event.preventDefault();

    setSavingSection("profile");
    setProfileError("");
    setProfileSuccess("");

    const formData = new FormData();

    Object.entries(profile).forEach(([key, value]) => {
      formData.append(`user[${key}]`, value);
    });

    if (avatarFile) {
      formData.append("user[avatar]", avatarFile);
    }

    try {
      const updatedUser = await apiFetch(`/api/v1/users/${currentUser.id}`, {
        method: "PATCH",
        body: formData,
      });

      setCurrentUser(updatedUser);
      setAvatarUrl(updatedUser.avatar_url || null);
      setAvatarFile(null);
      setProfileSuccess("Profile updated successfully.");
    } catch (error) {
      setProfileError(error.validationErrors?.[0]?.message || error.message);
    } finally {
      setSavingSection(null);
    }
  }

  async function handlePasswordSave(event) {
    event.preventDefault();

    setSavingSection("password");
    setPasswordError("");
    setPasswordSuccess("");

    if (passwords.password !== passwords.password_confirmation) {
      setPasswordError("New passwords do not match.");
      setSavingSection(null);
      return;
    }

    try {
      await apiFetch(`/api/v1/users/${currentUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ user: passwords }),
      });

      setPasswords({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      setPasswordSuccess("Password updated successfully.");
    } catch (error) {
      setPasswordError(error.validationErrors?.[0]?.message || error.message);
    } finally {
      setSavingSection(null);
    }
  }

  if (isLoading) {
    return (
      <main>
        <p>Loading profile...</p>
      </main>
    );
  }

  return (
    <main>
      <h1>My Profile</h1>

      <section>
        <h2>Profile Information</h2>

        {profileError && (
          <p className="error" role="alert">
            {profileError}
          </p>
        )}
        {profileSuccess && <p role="status">{profileSuccess}</p>}

        {avatarUrl && (
          <img
            src={avatarUrl}
            alt="Your profile avatar"
            width="100"
            height="100"
            style={{ objectFit: "cover", borderRadius: "50%" }}
          />
        )}

        <form onSubmit={handleProfileSave}>
          <div>
            <label htmlFor="avatar">Profile Photo</label>
            <input
              id="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
            />
          </div>

          <div>
            <label htmlFor="first_name">First Name</label>
            <input id="first_name" name="first_name" value={profile.first_name} onChange={handleProfileChange} />
          </div>

          <div>
            <label htmlFor="last_name">Last Name</label>
            <input id="last_name" name="last_name" value={profile.last_name} onChange={handleProfileChange} />
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={profile.email} onChange={handleProfileChange} required />
          </div>

          <div>
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" value={profile.phone} onChange={handleProfileChange} />
          </div>

          <div>
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" name="bio" value={profile.bio} onChange={handleProfileChange} rows={4} />
          </div>

          <button type="submit" disabled={savingSection !== null}>
            {savingSection === "profile" ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>

      <section>
        <h2>Change Password</h2>

        {passwordError && (
          <p className="error" role="alert">
            {passwordError}
          </p>
        )}
        {passwordSuccess && <p role="status">{passwordSuccess}</p>}

        <form onSubmit={handlePasswordSave}>
          <div>
            <label htmlFor="current_password">Current Password</label>
            <input
              id="current_password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              value={passwords.current_password}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={passwords.password}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password_confirmation">Confirm New Password</label>
            <input
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              value={passwords.password_confirmation}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <button type="submit" disabled={savingSection !== null}>
            {savingSection === "password" ? "Updating..." : "Change Password"}
          </button>
        </form>
      </section>
    </main>
  );
}
