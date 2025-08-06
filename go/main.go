package main

import (
	"flag"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"log"
	"os"

	_ "embed"

	"github.com/skip2/go-qrcode"
	"golang.org/x/image/font"
	"golang.org/x/image/font/opentype"
	"golang.org/x/image/math/fixed"
)

//go:embed assets/ARIALBD.TTF
var embeddedFont []byte

const (
	canvasWidth  = 1000
	canvasHeight = 1100
	qrSize       = 900
	qrY          = 50
	textY        = qrY + qrSize + 100
)

func drawQRWithLabel(qr image.Image, label string, face font.Face) image.Image {
	dst := image.NewRGBA(image.Rect(0, 0, canvasWidth, canvasHeight))

	// White background
	draw.Draw(dst, dst.Bounds(), &image.Uniform{color.White}, image.Point{}, draw.Src)

	// Draw QR code centered
	qrX := (canvasWidth - qrSize) / 2
	qrRect := image.Rect(qrX, qrY, qrX+qrSize, qrY+qrSize)
	draw.Draw(dst, qrRect, qr, qr.Bounds().Min, draw.Over)

	// Draw label centered
	d := &font.Drawer{
		Dst:  dst,
		Src:  image.Black,
		Face: face,
	}
	textWidth := d.MeasureString(label).Round()
	d.Dot = fixed.P((canvasWidth-textWidth)/2, textY)
	d.DrawString(label)

	return dst
}

func main() {
	// Define command-line flags
	var (
		qrcodeContent   = flag.String("content", "https://example.com/index.html?id=ABC12345678&mode=local", "QR code content (URL)")
		chargepointCode = flag.String("code", "ABC12345678", "Chargepoint code for the label")
		help            = flag.Bool("help", false, "Show usage information")
	)

	// Custom usage function
	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "QR Code Generator with Label\n\n")
		fmt.Fprintf(flag.CommandLine.Output(), "Usage: %s [options]\n\n", os.Args[0])
		fmt.Fprintf(flag.CommandLine.Output(), "Options:\n")
		flag.PrintDefaults()
		fmt.Fprintf(flag.CommandLine.Output(), "\nExamples:\n")
		fmt.Fprintf(flag.CommandLine.Output(), "  %s --content=\"https://example.com\" --code=\"ABC123\"\n", os.Args[0])
		fmt.Fprintf(flag.CommandLine.Output(), "  %s --code=\"ABC12345678\"\n", os.Args[0])
		fmt.Fprintf(flag.CommandLine.Output(), "  %s (uses all defaults)\n", os.Args[0])
	}

	// Parse command-line flags
	flag.Parse()

	// Show help if requested
	if *help {
		flag.Usage()
		return
	}

	// Log the values being used
	// log.Println("QR Code Content:", *qrcodeContent)
	// log.Println("Chargepoint Code:", *chargepointCode)

	// Load font
	face, err := loadEmbeddedFont(100) // 100px like original JS
	if err != nil {
		log.Fatal("Failed to load font:", err)
	}

	// Generate QR code
	qr, err := qrcode.New(*qrcodeContent, qrcode.Medium)
	if err != nil {
		log.Fatal("QR generation failed:", err)
	}

	// Create QR image and add label
	qrImage := qr.Image(qrSize)
	final := drawQRWithLabel(qrImage, *chargepointCode, face)

	err = png.Encode(os.Stdout, final)
	if err != nil {
		panic(err)
	}
}

func loadEmbeddedFont(size float64) (font.Face, error) {
	parsedFont, err := opentype.Parse(embeddedFont)
	if err != nil {
		return nil, err
	}
	return opentype.NewFace(parsedFont, &opentype.FaceOptions{
		Size:    size,
		DPI:     72,
		Hinting: font.HintingFull,
	})
}
