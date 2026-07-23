import { TypeConfig } from '../config.ts';

/**
 * Builds standard Flex Header block.
 */
export function buildFlexHeader(primaryConfig: TypeConfig, lineHeaderTitle: string) {
  return {
    type: "box",
    layout: "vertical",
    contents: [
      {
        type: "box",
        layout: "horizontal",
        alignItems: "center",
        contents: [
          {
            type: "text",
            text: primaryConfig.emoji,
            size: "lg",
            flex: 0
          },
          {
            type: "text",
            text: lineHeaderTitle,
            weight: "bold",
            color: "#ffffff",
            size: "sm",
            flex: 1,
            margin: "sm",
            wrap: true,
            align: "start"
          }
        ]
      }
    ],
    backgroundColor: primaryConfig.color,
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingStart: "15px",
    paddingEnd: "15px"
  };
}

/**
 * Helper to format timestamp in Thai time zone
 */
export function formatThaiTime(dateStr?: string): string {
  return new Date(dateStr || Date.now()).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  });
}
