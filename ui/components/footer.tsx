"use client"

import { Mail, Github, Linkedin } from "lucide-react"

export function Footer() {
    return (
        <footer className="mt-auto border-t py-12 bg-muted/30">
            <div className="mx-auto max-w-4xl px-4">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Questions or Missing Movies?</p>
                        <a
                            href="mailto:sivaganesh1903@gmail.com"
                            className="text-lg font-semibold hover:text-primary transition-colors flex items-center gap-2 justify-center"
                        >
                            <Mail className="h-4 w-4" />
                            sivaganesh1903@gmail.com
                        </a>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                        <a
                            href="https://github.com/sivab193"
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center justify-center p-2 rounded-full border bg-card hover:bg-primary/5 hover:border-primary/50 transition-all"
                            title="GitHub"
                        >
                            <Github className="h-5 w-5 hover:text-primary transition-colors" />
                        </a>
                        <a
                            href="https://linkedin.com/in/sivab193"
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center justify-center p-2 rounded-full border bg-card hover:bg-primary/5 hover:border-primary/50 transition-all"
                            title="LinkedIn"
                        >
                            <Linkedin className="h-5 w-5 hover:text-primary transition-colors" />
                        </a>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                        © {new Date().getFullYear()} Movies Tracker
                    </p>
                </div>
            </div>
        </footer>
    )
}
