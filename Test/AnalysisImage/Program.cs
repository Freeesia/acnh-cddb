using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using ColorMine.ColorSpaces;
using ColorMine.ColorSpaces.Comparisons;
using Google.Cloud.Vision.V1;

namespace AnalysisImage
{
    class Program
    {
        private static Rgb backColor = new Rgb() { R = 243, G = 241, B = 226 };
        private static (string name, Rgb color)[] colors = new[]
        {
            ("red", new Rgb() { R = 255 }),
            ("pink", new Rgb() { R = 255, G = 192, B = 203 }),
            ("orange", new Rgb() { R = 239, G = 129, B = 15 }),
            ("yellow", new Rgb() { R = 255, G = 255, B = 0 }),
            ("green", new Rgb() { G = 255 }),
            ("blue", new Rgb() { B = 255 }),
            ("purple", new Rgb() { R = 204, G = 0, B = 255 }),
            ("brown", new Rgb() { R = 158, G = 117, B = 58 }),
            ("white", new Rgb() { R = 255, G = 255, B = 255 }),
            ("black", new Rgb()),
        };
        private static IColorSpaceComparison colorComparison = new CieDe2000Comparison();
        private static Rectangle titleLine = new Rectangle(400, 140, 400, 0);
        private static Rectangle authorNameLine = new Rectangle(150, 450, 250, 0);
        private static Rectangle islandNameLine = new Rectangle(150, 500, 250, 0);
        private static Regex authorIdPattern = new Regex(@"^MA-\d{4}-\d{4}-\d{4}$");
        private static Regex designIdPattern = new Regex(@"^MO-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$");

        static async Task Main(string[] args)
        {
            // Instantiates a client
            var client = ImageAnnotatorClient.Create();
            // Load the image file into memory
            var image = Image.FromUri("https://pbs.twimg.com/media/EXuQTz5UwAE-LiI?format=jpg");

            var title = string.Empty;
            var islandName = string.Empty;
            var authorName = string.Empty;
            var authorId = string.Empty;
            var designId = string.Empty;

            var textAnnotations = await client.DetectTextAsync(image);
            foreach (var t in textAnnotations.Skip(1))
            {
                var rect = ToRect(t.BoundingPoly.Vertices);
                if (rect.IntersectsWith(titleLine))
                {
                    title += t.Description;
                }
                else if (rect.IntersectsWith(authorNameLine))
                {
                    authorName += t.Description;

                }
                else if (rect.IntersectsWith(islandNameLine))
                {
                    islandName += t.Description;
                }
                else if (authorIdPattern.IsMatch(t.Description))
                {
                    authorId = t.Description;
                }
                else if (designIdPattern.IsMatch(t.Description))
                {
                    designId = t.Description;
                }
            }

            Console.WriteLine("タイトル: " + title);
            Console.WriteLine("島名: " + islandName);
            Console.WriteLine("作者: " + authorName);
            Console.WriteLine("作者ID: " + authorId);
            Console.WriteLine("デザインID: " + designId);

            var context = new ImageContext()
            {
                ProductSearchParams = new ProductSearchParams()
                {
                    BoundingPoly = new BoundingPoly()
                    {
                        Vertices =
                        {
                            new Vertex() { X = 997, Y = 328 },
                            new Vertex() { X = 1150, Y = 328 },
                            new Vertex() { X = 997, Y = 482 },
                            new Vertex() { X = 1150, Y = 482 },
                        }
                    }
                }
            };
            var response = await client.DetectImagePropertiesAsync(image, context);
            foreach (var color in response.DominantColors.Colors.Where(c => c.Score > 0.05).OrderByDescending(c => c.PixelFraction))
            {
                var mineColor = new Rgb()
                {
                    R = color.Color.Red,
                    G = color.Color.Green,
                    B = color.Color.Blue,
                };
                if (IsBackColor(mineColor))
                {
                    Console.WriteLine($"{color.PixelFraction}: {color.Score}: {mineColor.To<Hex>().Code} (BackColor)");
                }
                else
                {
                    var apColor = GetApproximateColor(mineColor);
                    Console.WriteLine($"{color.PixelFraction}: {color.Score}: {mineColor.To<Hex>().Code} ({apColor})");
                }
            }
        }

        private static bool IsBackColor(Rgb color)
             => Math.Abs(color.R - backColor.R) < 5 &&
                Math.Abs(color.G - backColor.G) < 10 &&
                Math.Abs(color.B - backColor.B) < 20;
        private static string GetApproximateColor(Rgb color)
            => colors.Select(c => (c.name, d: c.color.Compare(color, colorComparison)))
                .OrderBy(c => c.d)
                .First()
                .name;

        private static Rectangle ToRect(IEnumerable<Vertex> box)
        {
            var left = box.Min(v => v.X);
            var right = box.Max(v => v.X);
            var top = box.Min(v => v.Y);
            var bottom = box.Max(v => v.Y);
            return Rectangle.FromLTRB(left, top, right, bottom);
        }
    }
}
