"use client"

import { useEffect } from "react"

const BULK_CITY_INPUT_ID = "bulk-theater-city"
const BULK_CITY_DATALIST_ID = "bulk-theater-city-options"

export function AdminTheaterCityAutocomplete() {
    useEffect(() => {
        const readExistingCities = () => {
            const theaterCitySelect = Array.from(document.querySelectorAll("select")).find((select) =>
                Array.from(select.options).some((option) => option.value === "All" && option.textContent?.trim().startsWith("All Cities"))
            )

            if (!theaterCitySelect) return []

            return Array.from(theaterCitySelect.options)
                .map((option) => option.value.trim())
                .filter((city) => city && city !== "All")
        }

        const enhanceBulkCityInput = () => {
            const input = document.getElementById(BULK_CITY_INPUT_ID) as HTMLInputElement | null
            if (!input) return

            let datalist = document.getElementById(BULK_CITY_DATALIST_ID) as HTMLDataListElement | null
            if (!datalist) {
                datalist = document.createElement("datalist")
                datalist.id = BULK_CITY_DATALIST_ID
                input.parentElement?.appendChild(datalist)
            }

            const existingCities = readExistingCities()
            datalist.replaceChildren(
                ...existingCities.map((city) => {
                    const option = document.createElement("option")
                    option.value = city
                    return option
                })
            )

            input.setAttribute("list", BULK_CITY_DATALIST_ID)
            input.setAttribute("autocomplete", "off")
            input.placeholder = existingCities.length ? "Select or type city" : "Type city / location"
        }

        enhanceBulkCityInput()

        const observer = new MutationObserver(enhanceBulkCityInput)
        observer.observe(document.body, { childList: true, subtree: true })

        return () => observer.disconnect()
    }, [])

    return null
}
