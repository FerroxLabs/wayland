---
name: firmware-developer
description: |
  Guides bare metal and RTOS firmware development including bootloader design, OTA updates, peripheral drivers, and production firmware practices
  Use when the user asks about firmware developer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of firmware developer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced iot guide networking"
  category: "emerging-tech"
  subcategory: "embedded-iot"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Firmware Developer

You are an expert firmware developer. You guide engineers through bare metal programming, RTOS task management, bootloader design, OTA update mechanisms, peripheral driver development, and production-grade firmware architecture for embedded systems.


## When to Use

**Use this skill when:**
- User asks about firmware developer techniques or best practices
- User needs guidance on firmware developer concepts
- User wants to implement or improve their approach to firmware developer

**Do NOT use when:**
- The request falls outside the scope of firmware developer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Firmware Architecture Layers

```
+--------------------------------------------------+
|  Application Logic (state machines, business)     |
+--------------------------------------------------+
|  Middleware (protocol stacks, file systems)        |
+--------------------------------------------------+
|  HAL / Board Support Package (BSP)                |
+--------------------------------------------------+
|  Peripheral Drivers (UART, SPI, I2C, GPIO, ADC)  |
+--------------------------------------------------+
|  RTOS / Bare Metal Scheduler                      |
+--------------------------------------------------+
|  Startup Code / Bootloader                        |
+--------------------------------------------------+
|  Hardware (MCU + Peripherals)                     |
+--------------------------------------------------+
```

## Bare Metal Programming

### Startup and Initialization

```c
/* startup.c - Minimal ARM Cortex-M startup code */

#include <stdint.h>

extern uint32_t _estack;
extern uint32_t _sidata, _sdata, _edata;
extern uint32_t _sbss, _ebss;
extern void main(void);

void Reset_Handler(void) {
    uint32_t *src = &_sidata;
    uint32_t *dst = &_sdata;
    while (dst < &_edata) *dst++ = *src++;

    dst = &_sbss;
    while (dst < &_ebss) *dst++ = 0;

    SystemClock_Config();
    main();
    while (1) {}
}

void Default_Handler(void) {
    while (1) {}
}

__attribute__((section(".isr_vector")))
void (*const vector_table[])(void) = {
    (void (*)(void))(&_estack),
    Reset_Handler, NMI_Handler, HardFault_Handler,
    MemManage_Handler, BusFault_Handler, UsageFault_Handler,
    0, 0, 0, 0, SVC_Handler, DebugMon_Handler, 0,
    PendSV_Handler, SysTick_Handler,
};
```

### Linker Script Essentials

```ld
/* firmware.ld - Linker script for STM32F4 */
MEMORY
{
    FLASH  (rx)  : ORIGIN = 0x08000000, LENGTH = 512K
    SRAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 128K
}

SECTIONS
{
    .isr_vector : { KEEP(*(.isr_vector)) } > FLASH
    .text : { *(.text*) *(.rodata*) _etext = .; } > FLASH
    _sidata = LOADADDR(.data);
    .data : { _sdata = .; *(.data*) _edata = .; } > SRAM AT> FLASH
    .bss : { _sbss = .; *(.bss*) *(COMMON) _ebss = .; } > SRAM
    _estack = ORIGIN(SRAM) + LENGTH(SRAM);
}
```

### Hardware Abstraction Layer (HAL) Pattern

```c
/* gpio_hal.h - Portable GPIO interface */
#ifndef GPIO_HAL_H
#define GPIO_HAL_H

#include <stdint.h>
#include <stdbool.h>

typedef enum { GPIO_MODE_INPUT, GPIO_MODE_OUTPUT, GPIO_MODE_AF, GPIO_MODE_ANALOG } gpio_mode_t;
typedef enum { GPIO_PULL_NONE, GPIO_PULL_UP, GPIO_PULL_DOWN } gpio_pull_t;

typedef struct { uint8_t port; uint8_t pin; } gpio_pin_t;
typedef struct { gpio_mode_t mode; gpio_pull_t pull; uint8_t af_num; bool open_drain; } gpio_config_t;

void gpio_init(gpio_pin_t pin, const gpio_config_t *config);
void gpio_write(gpio_pin_t pin, bool state);
bool gpio_read(gpio_pin_t pin);
void gpio_toggle(gpio_pin_t pin);

#endif

/* gpio_stm32f4.c - STM32F4 implementation */
#include "gpio_hal.h"
#include "stm32f4xx.h"

static GPIO_TypeDef *const gpio_ports[] = { GPIOA, GPIOB, GPIOC, GPIOD, GPIOE, GPIOF };

void gpio_init(gpio_pin_t pin, const gpio_config_t *config) {
    GPIO_TypeDef *port = gpio_ports[pin.port];
    RCC->AHB1ENR |= (1U << pin.port);
    port->MODER &= ~(3U << (pin.pin * 2));
    port->MODER |= ((uint32_t)config->mode << (pin.pin * 2));
    port->PUPDR &= ~(3U << (pin.pin * 2));
    port->PUPDR |= ((uint32_t)config->pull << (pin.pin * 2));
    if (config->open_drain) port->OTYPER |= (1U << pin.pin);
    else port->OTYPER &= ~(1U << pin.pin);
}

void gpio_write(gpio_pin_t pin, bool state) {
    gpio_ports[pin.port]->BSRR = state ? (1U << pin.pin) : (1U << (pin.pin + 16));
}

bool gpio_read(gpio_pin_t pin) {
    return (gpio_ports[pin.port]->IDR & (1U << pin.pin)) != 0;
}

void gpio_toggle(gpio_pin_t pin) {
    gpio_ports[pin.port]->ODR ^= (1U << pin.pin);
}
```

## RTOS Fundamentals

### FreeRTOS Task Architecture

```c
#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include "semphr.h"

#define PRIORITY_SENSOR    3
#define PRIORITY_COMM      2

static QueueHandle_t sensor_queue;
static SemaphoreHandle_t spi_mutex;

typedef struct {
    uint32_t timestamp;
    float    temperature, humidity;
    uint16_t adc_raw;
} sensor_data_t;

void task_sensor(void *params) {
    sensor_data_t data;
    TickType_t last_wake = xTaskGetTickCount();
    for (;;) {
        data.timestamp = xTaskGetTickCount();
        data.temperature = read_temperature();
        data.humidity = read_humidity();
        if (xSemaphoreTake(spi_mutex, pdMS_TO_TICKS(100)) == pdTRUE) {
            data.adc_raw = spi_read_adc();
            xSemaphoreGive(spi_mutex);
        }
        xQueueSend(sensor_queue, &data, 0);
        vTaskDelayUntil(&last_wake, pdMS_TO_TICKS(100));
    }
}

void task_comm(void *params) {
    sensor_data_t data;
    for (;;) {
        if (xQueueReceive(sensor_queue, &data, portMAX_DELAY) == pdTRUE)
            transmit_data(&data);
    }
}

int main(void) {
    hardware_init();
    sensor_queue = xQueueCreate(10, sizeof(sensor_data_t));
    spi_mutex = xSemaphoreCreateMutex();
    xTaskCreate(task_sensor, "Sensor", 256, NULL, PRIORITY_SENSOR, NULL);
    xTaskCreate(task_comm,   "Comm",   512, NULL, PRIORITY_COMM,   NULL);
    vTaskStartScheduler();
    while (1) {}
}
```

### Stack Sizing Guidelines

| Task Type | Typical Stack | Notes |
|-----------|--------------|-------|
| Simple GPIO toggle | 128 words | Minimal local variables |
| Sensor read + filter | 256 words | Floating point, buffers |
| Communication (UART) | 512 words | String formatting, buffers |
| Network stack (TCP) | 1024+ words | Deep call chains |

Use `uxTaskGetStackHighWaterMark()` at runtime to monitor actual usage.

## Bootloader Design

### Dual-Bank Boot Architecture

```
Flash Memory Layout:
+-------------------+ 0x08000000
| Bootloader (32K)  |
+-------------------+ 0x08008000
| App Slot A (240K) |  <- Primary application
+-------------------+ 0x08044000
| App Slot B (240K) |  <- OTA update target
+-------------------+

Boot Flow:
1. Bootloader starts
2. Check update flag in NVS
3. If update pending: validate Slot B -> copy to Slot A -> clear flag
4. Validate Slot A header + CRC
5. Jump to application
```

```c
/* bootloader.c - Minimal secure bootloader */
#define APP_SLOT_A    0x08008000
#define APP_SLOT_B    0x08044000
#define APP_MAX_SIZE  (240 * 1024)
#define APP_MAGIC     0xDEADBEEF

typedef struct {
    uint32_t magic, version, size, crc32, entry_point;
    uint8_t  reserved[12];
} app_header_t;

static uint32_t crc32_calculate(const uint8_t *data, uint32_t length) {
    uint32_t crc = 0xFFFFFFFF;
    for (uint32_t i = 0; i < length; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++)
            crc = (crc >> 1) ^ (0xEDB88320 & -(crc & 1));
    }
    return ~crc;
}

static bool validate_app(uint32_t base_addr) {
    const app_header_t *hdr = (const app_header_t *)base_addr;
    if (hdr->magic != APP_MAGIC || hdr->size > APP_MAX_SIZE) return false;
    const uint8_t *app_data = (const uint8_t *)(base_addr + sizeof(app_header_t));
    return crc32_calculate(app_data, hdr->size - sizeof(app_header_t)) == hdr->crc32;
}

static void jump_to_app(uint32_t base_addr) {
    uint32_t *app_vector = (uint32_t *)(base_addr + sizeof(app_header_t));
    __disable_irq();
    SCB->VTOR = (uint32_t)app_vector;
    __set_MSP(app_vector[0]);
    ((void (*)(void))app_vector[1])();
}

void bootloader_main(void) {
    if (check_update_flag() && validate_app(APP_SLOT_B)) {
        flash_copy(APP_SLOT_A, APP_SLOT_B, APP_MAX_SIZE);
        clear_update_flag();
    }
    if (validate_app(APP_SLOT_A)) jump_to_app(APP_SLOT_A);
    if (validate_app(APP_SLOT_B)) jump_to_app(APP_SLOT_B);
    enter_dfu_mode();
}
```

## OTA Update Mechanism

### Chunked Transfer Protocol

```c
typedef enum {
    OTA_STATE_IDLE, OTA_STATE_RECEIVING, OTA_STATE_VERIFYING,
    OTA_STATE_APPLYING, OTA_STATE_COMPLETE, OTA_STATE_ERROR
} ota_state_t;

typedef struct {
    ota_state_t state;
    uint32_t    total_size, received, expected_crc, running_crc;
    uint32_t    chunk_count, last_activity;
} ota_context_t;

static ota_context_t ota;

int ota_begin(uint32_t total_size, uint32_t expected_crc) {
    if (total_size > APP_MAX_SIZE) return -1;
    if (flash_erase_region(APP_SLOT_B, total_size) != 0) return -2;
    ota = (ota_context_t){
        .state = OTA_STATE_RECEIVING, .total_size = total_size,
        .expected_crc = expected_crc, .running_crc = 0xFFFFFFFF,
        .last_activity = get_tick_ms()
    };
    return 0;
}

int ota_write_chunk(const uint8_t *data, uint16_t length, uint32_t offset) {
    if (ota.state != OTA_STATE_RECEIVING || offset != ota.received) return -1;
    uint32_t addr = APP_SLOT_B + sizeof(app_header_t) + offset;
    if (flash_write(addr, data, length) != 0) { ota.state = OTA_STATE_ERROR; return -3; }
    ota.running_crc = crc32_update(ota.running_crc, data, length);
    ota.received += length;
    ota.chunk_count++;
    ota.last_activity = get_tick_ms();
    if (ota.received >= ota.total_size) return ota_verify_and_apply();
    return 0;
}
```

## Debugging Techniques

### Fault Handler with Register Dump

```c
void HardFault_Handler(void) {
    __asm volatile (
        "tst lr, #4 \n" "ite eq \n"
        "mrseq r0, msp \n" "mrsne r0, psp \n"
        "b hard_fault_handler \n" );
}

void hard_fault_handler(uint32_t *stack_frame) {
    crash_log_write(stack_frame[6]/*PC*/, stack_frame[5]/*LR*/,
                    SCB->CFSR, SCB->HFSR);
    NVIC_SystemReset();
}
```

## Common Pitfalls

| Mistake | Impact | Solution |
|---------|--------|----------|
| No volatile on HW registers | Compiler optimizes away reads | Always use volatile for MMIO |
| Stack overflow | Memory corruption, random crashes | Monitor high-water mark, size correctly |
| Unprotected shared data | Race conditions | Use mutexes/critical sections |
| Blocking in ISR | Missed interrupts, watchdog timeout | Set flag in ISR, process in task |
| No CRC on OTA image | Bricked devices | Validate before applying, keep fallback |
| No watchdog | Unrecoverable hangs | Always enable WDT in production |
| Printf in production | Code size, timing, security | Use compact logging levels |

## Build System Configuration

### CMake for Embedded

```cmake
cmake_minimum_required(VERSION 3.20)
set(CMAKE_SYSTEM_NAME Generic)
set(CMAKE_SYSTEM_PROCESSOR arm)
set(CMAKE_C_COMPILER arm-none-eabi-gcc)
set(CMAKE_OBJCOPY arm-none-eabi-objcopy)

project(firmware C ASM)

set(CPU_FLAGS "-mcpu=cortex-m4 -mthumb -mfloat-abi=hard -mfpu=fpv4-sp-d16")
set(CMAKE_C_FLAGS "${CPU_FLAGS} -Wall -Wextra -ffunction-sections -fdata-sections")
set(CMAKE_C_FLAGS_DEBUG "-O0 -g3 -DDEBUG")
set(CMAKE_C_FLAGS_RELEASE "-O2 -DNDEBUG")
set(CMAKE_EXE_LINKER_FLAGS "-T${CMAKE_SOURCE_DIR}/firmware.ld -Wl,--gc-sections --specs=nosys.specs")

add_executable(firmware src/main.c src/startup.c src/gpio_hal.c src/uart_driver.c)

add_custom_command(TARGET firmware POST_BUILD
    COMMAND ${CMAKE_OBJCOPY} -O binary firmware firmware.bin
    COMMAND ${CMAKE_OBJCOPY} -O ihex firmware firmware.hex
    COMMAND arm-none-eabi-size firmware)
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to firmware developer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Firmware Developer Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with firmware developer for my current situation"

**Output:**

Based on your situation, here is a structured approach to firmware developer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
