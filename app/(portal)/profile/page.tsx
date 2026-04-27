import styles from "../portal.module.css";
import profileStyles from "./profile.module.css";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

export default function ProfilePage() {
  return (
    <div className={profileStyles.layout}>
      <div>
        <h1 className={styles.pageTitle}>
          My <em>Profile</em>
        </h1>
        <p className={styles.pageSub}>
          The more you share, the more tailored your support can be.
        </p>
      </div>
      <ProfileForm />
      <PasswordForm />
    </div>
  );
}
