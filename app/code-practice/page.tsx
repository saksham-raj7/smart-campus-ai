"use client";
import { useRouter } from "next/navigation";
import { CodePracticeLab } from "@/components/code-practice/code-practice-lab";
export default function CodePracticePage() { const router = useRouter(); return <CodePracticeLab onClose={() => router.push("/learn-practice")} />; }
