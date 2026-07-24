export function AdminPageHead({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="admin-welcome"><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div></div>;
}
