import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ProfileCard-RichardSterling');
  name: string = 'Richard Sterling Jackson';
  location: string = 'Seattle, Washington, USA';
  numberofprojects: number = 3
  description: string = 'Welcome to my GitHub Portfolio! I am a recent graduate from Arizona State University with a passion for creating innovative solutions. With a background in Computer Science with a focus in Software Engineering and a background in Earth & Space Exploration with a concentration in Geological and Planetary Sciences, I have developed a knack for problem-solving. I thrive on turning ideas into reality. When I am not coding, you can find me off-roading, boating, exploring the outdoors, reading tech blogs and magazines, or experimenting with electrical components. Currently I am learning to integrate and automate with Programmable Logic Controllers and Variable Frequency Drives. Let\'s connect and do something amazing together!';

}
