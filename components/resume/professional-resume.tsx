import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import * as React from "react";
import type { ReactNode } from "react";

export type ResumeEntry = {
  title: string;
  subtitle?: string;
  date?: string;
  detail?: string;
};

export type StructuredResume = {
  personalInfo: { name: string; title?: string; email?: string; phone?: string; location?: string };
  summary?: string;
  education: ResumeEntry[];
  experience: ResumeEntry[];
  projects: ResumeEntry[];
  skills: string[];
  certifications: ResumeEntry[];
  achievements: string[];
  links: string[];
};

const styles = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 44, paddingHorizontal: 48, fontFamily: "Helvetica", fontSize: 9.5, color: "#172033", lineHeight: 1.45 },
  header: { borderBottomWidth: 1.5, borderBottomColor: "#243b6b", paddingBottom: 12, marginBottom: 16 },
  name: { fontSize: 23, fontFamily: "Helvetica-Bold", color: "#162b55", letterSpacing: 0.1, maxWidth: "100%" },
  role: { marginTop: 2, fontSize: 10.5, color: "#40516d" },
  contact: { marginTop: 7, color: "#40516d", fontSize: 8.5 },
  section: { marginTop: 12 },
  sectionTitle: { color: "#162b55", fontFamily: "Helvetica-Bold", fontSize: 9.5, letterSpacing: 1.1, borderBottomWidth: 0.75, borderBottomColor: "#cbd5e1", paddingBottom: 3, marginBottom: 6 },
  paragraph: { color: "#25334b", lineHeight: 1.5 },
  entry: { marginBottom: 8 },
  entryTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  entryTitle: { flexGrow: 1, fontFamily: "Helvetica-Bold", color: "#172b4d" },
  date: { flexShrink: 0, color: "#52627a", fontSize: 8.5, textAlign: "right" },
  subtitle: { marginTop: 1, color: "#40516d", fontSize: 9 },
  detail: { marginTop: 2, color: "#25334b" },
  bullets: { marginTop: 3, gap: 2 },
  bulletRow: { flexDirection: "row", gap: 5, paddingRight: 4 },
  bullet: { color: "#40516d" },
  bulletText: { flex: 1, color: "#25334b" },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skill: { backgroundColor: "#edf2f8", color: "#243b6b", paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 2, fontSize: 8.5 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  link: { color: "#284d89", textDecoration: "none", fontSize: 8.5 },
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function Detail({ value }: { value?: string }) {
  if (!value) return null;
  const lines = value.split(/\n|(?<=[.!?])\s+(?=[A-Z])/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return <Text style={styles.detail}>{value}</Text>;
  return <View style={styles.bullets}>{lines.map((line, index) => <View key={`${line}-${index}`} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{line.replace(/^[•-]\s*/, "")}</Text></View>)}</View>;
}

function Entries({ entries }: { entries: ResumeEntry[] }) {
  return <>{entries.map((entry, index) => <View key={`${entry.title}-${index}`} style={styles.entry} wrap={false}><View style={styles.entryTop}><Text style={styles.entryTitle}>{entry.title}</Text>{entry.date ? <Text style={styles.date}>{entry.date}</Text> : null}</View>{entry.subtitle ? <Text style={styles.subtitle}>{entry.subtitle}</Text> : null}<Detail value={entry.detail} /></View>)}</>;
}

export function ProfessionalResumePdf({ resume }: { resume: StructuredResume }) {
  const contact = [resume.personalInfo.email, resume.personalInfo.phone, resume.personalInfo.location].filter(Boolean).join("  |  ");
  return <Document title={`${resume.personalInfo.name || "Skillora"} Resume`} author={resume.personalInfo.name || "Skillora"}>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{resume.personalInfo.name || "Resume"}</Text>
        {resume.personalInfo.title ? <Text style={styles.role}>{resume.personalInfo.title}</Text> : null}
        {contact ? <Text style={styles.contact}>{contact}</Text> : null}
        {resume.links.length ? <View style={[styles.links, { marginTop: 4 }]}>{resume.links.map((link) => <Link key={link} src={link.includes("://") ? link : `https://${link}`} style={styles.link}>{link.replace(/^https?:\/\//, "")}</Link>)}</View> : null}
      </View>
      {resume.summary ? <Section title="SUMMARY"><Text style={styles.paragraph}>{resume.summary}</Text></Section> : null}
      {resume.education.length ? <Section title="EDUCATION"><Entries entries={resume.education} /></Section> : null}
      {resume.experience.length ? <Section title="EXPERIENCE"><Entries entries={resume.experience} /></Section> : null}
      {resume.projects.length ? <Section title="PROJECTS"><Entries entries={resume.projects} /></Section> : null}
      {resume.skills.length ? <Section title="SKILLS"><View style={styles.skills}>{resume.skills.map((skill) => <Text key={skill} style={styles.skill}>{skill}</Text>)}</View></Section> : null}
      {resume.certifications.length ? <Section title="CERTIFICATIONS"><Entries entries={resume.certifications} /></Section> : null}
      {resume.achievements.length ? <Section title="ACHIEVEMENTS"><View style={styles.bullets}>{resume.achievements.map((achievement, index) => <View key={`${achievement}-${index}`} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{achievement}</Text></View>)}</View></Section> : null}
    </Page>
  </Document>;
}
