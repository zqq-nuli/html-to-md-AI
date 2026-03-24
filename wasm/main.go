package main

import (
	"syscall/js"

	htmltomarkdown "github.com/JohannesKaufmann/html-to-markdown/v2"
	"github.com/JohannesKaufmann/html-to-markdown/v2/converter"
)

func convertHTMLToMarkdown(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return js.ValueOf(map[string]interface{}{
			"error":    "missing html argument",
			"markdown": "",
		})
	}

	html := args[0].String()
	domain := ""
	if len(args) > 1 && args[1].Type() == js.TypeString {
		domain = args[1].String()
	}

	var markdown string
	var err error

	if domain != "" {
		markdown, err = htmltomarkdown.ConvertString(html, converter.WithDomain(domain))
	} else {
		markdown, err = htmltomarkdown.ConvertString(html)
	}

	if err != nil {
		return js.ValueOf(map[string]interface{}{
			"error":    err.Error(),
			"markdown": "",
		})
	}

	return js.ValueOf(map[string]interface{}{
		"error":    "",
		"markdown": markdown,
	})
}

func main() {
	c := make(chan struct{})
	js.Global().Set("convertHTMLToMarkdown", js.FuncOf(convertHTMLToMarkdown))
	js.Global().Set("wasmReady", js.ValueOf(true))
	<-c
}
