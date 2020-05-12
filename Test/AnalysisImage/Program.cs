using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Google.Cloud.Vision.V1;

namespace AnalysisImage
{
    class Program
    {
        private static Regex authorPattern = new Regex(@"^MA-\d{4}-\d{4}-\d{4}$");
        private static Regex designPattern = new Regex(@"^MO-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$");

        static async Task Main(string[] args)
        {
            // Instantiates a client
            var client = ImageAnnotatorClient.Create();
            // Load the image file into memory
            var image = Image.FromUri("https://pbs.twimg.com/media/EXVpohEUEAAl4BM?format=jpg");
            var res = await client.DetectTextAsync(image);
            var author = res.Select(r => r.Description).FirstOrDefault(t => authorPattern.IsMatch(t));
            Console.WriteLine($"作者：{author}");
            var design = res.Select(r => r.Description).FirstOrDefault(t => designPattern.IsMatch(t));
            Console.WriteLine($"デザイン：{design}");
        }
    }
}
