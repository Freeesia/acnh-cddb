using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Google.Cloud.Vision.V1;

namespace AnalysisImage
{
    class Program
    {
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
            var image = Image.FromUri("https://pbs.twimg.com/media/EXVpohEUEAAl4BM?format=jpg");

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
        }

        private static Point ToPoint(Vertex v) => new Point(v.X, v.Y);

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
