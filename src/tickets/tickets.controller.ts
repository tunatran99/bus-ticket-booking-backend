import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TicketsService } from "./tickets.service";
import { SendTicketDto } from "./dto/send-ticket.dto";

@ApiTags("Tickets")
@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post("email")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send an e-ticket via email" })
  @ApiResponse({ status: 200, description: "Ticket email sent (or simulated)" })
  async sendTicketEmail(@Body() dto: SendTicketDto) {
    return this.ticketsService.sendTicketEmail(dto);
  }
}
