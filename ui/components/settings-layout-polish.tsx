"use client"

export function SettingsLayoutPolish() {
    return (
        <style jsx global>{`
            #public-toggle {
                margin-left: auto;
            }

            label[for="public-toggle"] {
                width: 100%;
                min-width: 0;
                align-items: flex-start;
                text-align: left;
            }

            label[for="public-toggle"] > span {
                display: block;
                width: 100%;
            }

            label[for="public-toggle"] + button {
                align-self: flex-start;
                margin-left: auto;
            }

            @media (min-width: 640px) {
                label[for="public-toggle"] {
                    flex: 1 1 auto;
                }

                label[for="public-toggle"] + button {
                    align-self: center;
                    flex: 0 0 auto;
                }
            }
        `}</style>
    )
}
