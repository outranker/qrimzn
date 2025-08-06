package main

import (
	"flag"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"io"
	"os"

	_ "embed"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"

	"github.com/skip2/go-qrcode"
	_ "golang.org/x/image/bmp"
	xdraw "golang.org/x/image/draw"
	"golang.org/x/image/font"
	"golang.org/x/image/font/opentype"
	"golang.org/x/image/math/fixed"
	_ "golang.org/x/image/tiff"
	_ "golang.org/x/image/webp"
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

func resizeImage(img image.Image, width int) image.Image {
	bounds := img.Bounds()
	originalWidth := bounds.Dx()
	originalHeight := bounds.Dy()

	// Don't enlarge images
	if originalWidth <= width {
		return img
	}

	// Calculate new height maintaining aspect ratio
	height := (originalHeight * width) / originalWidth

	// Create new image with calculated dimensions
	dst := image.NewRGBA(image.Rect(0, 0, width, height))

	// Use BiLinear interpolation for better quality
	xdraw.BiLinear.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)

	return dst
}

func decodeImage(reader io.Reader) (image.Image, error) {
	// Try to decode as different formats
	img, format, err := image.Decode(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image (supported formats: JPEG, PNG, GIF, BMP, TIFF, WebP): %v", err)
	}

	fmt.Fprintf(os.Stderr, "Decoded image format: %s\n", format)
	return img, nil
}

func generateQRCode(content, code string) error {
	// Load font
	face, err := loadEmbeddedFont(100) // 100px like original JS
	if err != nil {
		return fmt.Errorf("failed to load font: %v", err)
	}

	// Generate QR code
	qr, err := qrcode.New(content, qrcode.Medium)
	if err != nil {
		return fmt.Errorf("QR generation failed: %v", err)
	}

	// Create QR image and add label
	qrImage := qr.Image(qrSize)
	final := drawQRWithLabel(qrImage, code, face)

	err = png.Encode(os.Stdout, final)
	if err != nil {
		return fmt.Errorf("failed to encode PNG: %v", err)
	}

	return nil
}

func resizeImageFromStdin(width int) error {
	// start := time.Now()

	// Check if stdin has data
	stat, err := os.Stdin.Stat()
	if err != nil {
		return fmt.Errorf("failed to stat stdin: %v", err)
	}
	if (stat.Mode() & os.ModeCharDevice) != 0 {
		return fmt.Errorf("no data provided via stdin (pipe some image data)")
	}

	fmt.Fprintf(os.Stderr, "Reading image data from stdin...\n")

	// Read image from stdin
	img, err := decodeImage(os.Stdin)
	if err != nil {
		return err
	}

	// Resize the image
	resized := resizeImage(img, width)

	// Encode as PNG to stdout
	err = png.Encode(os.Stdout, resized)
	if err != nil {
		return fmt.Errorf("failed to encode resized image: %v", err)
	}

	// end := time.Now()
	// log.Printf("resizeImg %d took %d ms", width, end.Sub(start).Milliseconds())

	return nil
}

func main() {
	// Define command-line flags
	var (
		operationType   = flag.String("type", "qrcode", "Operation type: 'qrcode' or 'resize'")
		qrcodeContent   = flag.String("content", "https://example.com/index.html?id=ABC12345678&mode=local", "QR code content (URL)")
		chargepointCode = flag.String("code", "ABC12345678", "Chargepoint code for the label")
		width           = flag.Int("width", 800, "Target width for image resizing")
		help            = flag.Bool("help", false, "Show usage information")
	)

	// Custom usage function
	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "Image Processing Tool (QR Code Generation & Image Resizing)\n\n")
		fmt.Fprintf(flag.CommandLine.Output(), "Usage: %s [options]\n\n", os.Args[0])
		fmt.Fprintf(flag.CommandLine.Output(), "Options:\n")
		flag.PrintDefaults()
		fmt.Fprintf(flag.CommandLine.Output(), "\nExamples:\n")
		fmt.Fprintf(flag.CommandLine.Output(), "  QR Code Generation:\n")
		fmt.Fprintf(flag.CommandLine.Output(), "    %s --type=qrcode --content=\"https://example.com\" --code=\"ABC123\"\n", os.Args[0])
		fmt.Fprintf(flag.CommandLine.Output(), "    %s --code=\"ABC12345678\" (default type is qrcode)\n", os.Args[0])
		fmt.Fprintf(flag.CommandLine.Output(), "\n  Image Resizing:\n")
		fmt.Fprintf(flag.CommandLine.Output(), "    %s --type=resize --width=400 < input.jpg > output.png\n", os.Args[0])
		fmt.Fprintf(flag.CommandLine.Output(), "    cat image.png | %s --type=resize --width=1200 > resized.png\n", os.Args[0])
	}

	// Parse command-line flags
	flag.Parse()

	// Show help if requested
	if *help {
		flag.Usage()
		return
	}

	var err error

	switch *operationType {
	case "qrcode":
		err = generateQRCode(*qrcodeContent, *chargepointCode)
	case "resize":
		err = resizeImageFromStdin(*width)
	default:
		fmt.Fprintf(os.Stderr, "Error: Invalid operation type '%s'. Must be 'qrcode' or 'resize'\n", *operationType)
		flag.Usage()
		os.Exit(1)
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
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
