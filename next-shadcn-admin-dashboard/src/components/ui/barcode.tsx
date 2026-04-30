"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeProps extends React.SVGProps<SVGSVGElement> {
    value: string;
    format?: string;
    lineColor?: string;
    width?: number;
    height?: number;
    fontSize?: number;
    displayValue?: boolean;
}

export function Barcode({
    value,
    format = "CODE128",
    lineColor = "#000000",
    width = 2,
    height = 50,
    fontSize = 14,
    displayValue = true,
    ...props
}: BarcodeProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current && value) {
            try {
                JsBarcode(svgRef.current, value, {
                    format,
                    lineColor,
                    width,
                    height,
                    fontSize,
                    displayValue,
                    margin: 0,
                });
            } catch (error) {
                console.error("Invalid barcode format", error);
            }
        }
    }, [value, format, lineColor, width, height, displayValue]);

    if (!value) return null;

    return <svg ref={svgRef} {...props} />;
}
