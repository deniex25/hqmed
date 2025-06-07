import { ThemeProvider } from "@emotion/react"
import { CssBaseline } from "@mui/material"
import { HqmedTheme } from "./"

export const AppTheme = ({ children }) => {
    return (
        <ThemeProvider theme={ HqmedTheme }>
            <CssBaseline />
            { children }
        </ThemeProvider>

    )
}