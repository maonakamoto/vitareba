import styles from "./Logo.module.css";

interface LogoProps {
  variant?: "dark" | "light";
  tagline?: string;
  small?: boolean;
}

export default function Logo({ variant = "dark", tagline, small }: LogoProps) {
  const classes = [
    styles.logo,
    variant === "light" ? styles.light : "",
    small ? styles.small : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      Vita<span className={styles.accent}>Re</span>Ba
      {tagline && <span> · {tagline}</span>}
    </div>
  );
}
