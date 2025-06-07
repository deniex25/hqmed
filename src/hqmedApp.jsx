import { AppRouter } from "./router/AppRouter";
import { AppTheme } from './theme'

export const HqmedApp = () => {
  return (
    <AppTheme>
      <AppRouter />
    </AppTheme>
  )
}
