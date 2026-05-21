// Design tokens extracted via Figma MCP `get_variable_defs` across the five
// Perfil/Explorar/Evento/Ramificação/Conclusão frames in file 3881KN5rsk0ptFBGEAOlR6.
// Values mirror CSS custom properties declared in `src/index.css`.

export const colors = {
  pink: {
    normal: '#E8176B',       // Foundation /Pink/Normal
    light: '#FDE8F0',        // Foundation /Pink/Light
    lightHover: '#FCDCE9',   // Foundation /Pink/Light :hover
    lightActive: '#F8B7D1',  // Foundation /Pink/Light :active
  },
  orange: {
    normal: '#FF8800',       // Foundation /Orange/Normal
    dark: '#BF6600',         // Foundation /Orange/Dark
    light: '#FFF3E6',        // Foundation /Orange/Light
    lightHover: '#FFEDD9',   // Foundation /Orange/Light :hover
    lightActive: '#FFDAB0',  // Foundation /Orange/Light :active
  },
  grey: {
    light: '#F8F8F8',        // Foundation /Grey/Light
    lightActive: '#E8E8E8',  // Foundation /Grey/Light :active
    normal: '#B6B6B6',       // Foundation /Grey/Normal
    dark: '#898989',         // Foundation /Grey/Dark
    darkActive: '#525252',   // Foundation /Grey/Dark :active
    darker: '#404040',       // Foundation /Grey/Darker
  },
  typography: {
    title: '#120D26',        // Color/Typography/Title
  },
} as const

export type Colors = typeof colors
